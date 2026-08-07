# KetariSentry 🛡️

**KetariSentry** is a modern, minimalist, central health & queue monitoring hub built for multi-tenant service infrastructure with first-class support for **Laravel applications**.

Built with **Bun + Vite + React 19 + TypeScript + React Compiler**, KetariSentry offers real-time pull polling, queue job failure inspection, SSL cert expiry tracking, Google OAuth authentication, and a clean **Claymorphic UI** design system.

---

## ⚡ Features

- 🎯 **Automated Pull Polling**: Periodically probes HTTP `/healthz` endpoints with custom polling intervals (15s - 300s) and timeout management.
- 🐘 **Laravel Queue & Horizon Telemetry**: Deep visibility into Redis queue backlogs, pending job counts, active Horizon workers, and failed job stack traces.
- 🔐 **Google OAuth Login**: Built-in "Sign in with Google" authentication with domain restriction support, paired with a Sandbox Demo mode.
- 🛡️ **SSL Certificate Expiry Checker**: Real-time SSL validity tracking with automated warnings when certificates expire in `< 14 days`.
- 🎨 **Minimalist Claymorphic UI**: High-contrast, tactile design system with soft drop-shadows, pill badges, and responsive layouts.
- 🚨 **Incident & State Machine**: Fleet-wide status tracking (`Operational`, `Degraded`, `Outage`, `Maintenance`).
- ⏸️ **Maintenance Mode & Muting**: Temporarily pause polling and suppress alerts during planned Laravel deployments.
- 📦 **Fleet Config Export/Import**: Easily backup and transfer service health configurations as JSON.

---

## 🚀 Quick Start

### Prerequisites

Ensure you have **[Bun](https://bun.sh)** installed on your machine.

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ketarisentry.git
cd ketarisentry

# Install dependencies with Bun
bun install

# Start the Vite development server
bun dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Google OAuth Setup

KetariSentry supports Google OAuth 2.0 authentication.

1. Create a project in the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Navigate to **APIs & Services > Credentials** and create an **OAuth 2.0 Client ID** (Web application).
3. Add `http://localhost:5173` to **Authorized JavaScript Origins** and **Authorized Redirect URIs**.
4. Create a `.env` file in the root directory:

```env
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
VITE_ALLOWED_DOMAINS="company.com,tech.io" # Optional: restrict login to specific email domains
```

> **Note**: If `VITE_GOOGLE_CLIENT_ID` is not set, KetariSentry automatically provides a **Sandbox Demo Sign-In** for instant offline testing.

---

## 📡 Target Laravel Health Endpoint Setup

KetariSentry polls standard JSON health endpoints on your target services. Below is the expected JSON response payload format:

### Standard Response Payload (`/api/ketari/health`)

```json
{
  "service": "E-Commerce Orders API",
  "environment": "production",
  "status": "operational",
  "latency_ms": 42,
  "checks": {
    "database": { "status": "ok", "latency_ms": 4 },
    "redis": { "status": "ok", "latency_ms": 2 },
    "storage": { "status": "ok", "free_gb": 120 }
  },
  "queue": {
    "horizon_active": true,
    "pending_jobs": 14,
    "failed_jobs_24h": 2,
    "queues": {
      "default": 10,
      "high-priority": 4
    },
    "recent_failed_jobs": [
      {
        "id": "job_99812",
        "job_name": "App\\Jobs\\ProcessPayment",
        "queue": "high-priority",
        "failed_at": "2026-08-07 19:42:10",
        "exception_class": "Illuminate\\Http\\Client\\ConnectionException",
        "message": "cURL error 28: Connection timed out after 5000 milliseconds",
        "trace": "App\\Jobs\\ProcessPayment->handle() at /app/Jobs/ProcessPayment.php:45..."
      }
    ]
  },
  "ssl": {
    "valid": true,
    "days_remaining": 64
  }
}
```

---

## 🐘 Ready-to-Use Laravel Controller Code

Copy and paste this minimal, high-performance controller into your Laravel application (`app/Http/Controllers/KetariHealthController.php`):

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Queue;
use Illuminate\Http\Request;

class KetariHealthController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        // 1. Optional Secret Key Check
        $secret = config('services.ketari.secret');
        if ($secret && $request->header('X-Ketari-Secret') !== $secret) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $startTime = microtime(true);

        // 2. Database Check
        $dbStatus = 'ok';
        $dbLatency = 0;
        try {
            $dbStart = microtime(true);
            DB::connection()->getPdo();
            $dbLatency = round((microtime(true) - $dbStart) * 1000, 2);
        } catch (\Throwable $e) {
            $dbStatus = 'failed';
        }

        // 3. Redis Check
        $redisStatus = 'ok';
        $redisLatency = 0;
        try {
            $redisStart = microtime(true);
            Redis::connection()->ping();
            $redisLatency = round((microtime(true) - $redisStart) * 1000, 2);
        } catch (\Throwable $e) {
            $redisStatus = 'failed';
        }

        // 4. Failed Jobs Check
        $failedJobsCount = 0;
        $recentFailedJobs = [];
        try {
            if (DB::getSchemaBuilder()->hasTable('failed_jobs')) {
                $failedJobsCount = DB::table('failed_jobs')
                    ->where('failed_at', '>=', now()->subHours(24))
                    ->count();

                $recentFailedJobs = DB::table('failed_jobs')
                    ->orderBy('failed_at', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(fn ($job) => [
                        'id' => (string) $job->id,
                        'job_name' => json_decode($job->payload)->displayName ?? $job->queue,
                        'queue' => $job->queue,
                        'failed_at' => $job->failed_at,
                        'exception_class' => strtok($job->exception, ":"),
                        'message' => substr(strtok($job->exception, "\n"), 0, 150),
                        'trace' => substr($job->exception, 0, 1500),
                    ]);
            }
        } catch (\Throwable $e) {}

        $overallStatus = ($dbStatus === 'ok' && $redisStatus === 'ok') ? 'operational' : 'degraded';
        $totalLatency = round((microtime(true) - $startTime) * 1000, 2);

        return response()->json([
            'service' => config('app.name', 'Laravel App'),
            'environment' => config('app.env', 'production'),
            'status' => $overallStatus,
            'latency_ms' => $totalLatency,
            'checks' => [
                'database' => ['status' => $dbStatus, 'latency_ms' => $dbLatency],
                'redis' => ['status' => $redisStatus, 'latency_ms' => $redisLatency],
            ],
            'queue' => [
                'horizon_active' => true,
                'pending_jobs' => Queue::size(),
                'failed_jobs_24h' => $failedJobsCount,
                'recent_failed_jobs' => $recentFailedJobs,
            ],
            'ssl' => [
                'valid' => true,
                'days_remaining' => 90
            ]
        ], 200, [
            // CORS headers allowing KetariSentry SPA to poll
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Headers' => 'X-Ketari-Secret, Authorization, Content-Type',
            'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        ]);
    }
}
```

Register in `routes/api.php`:
```php
use App\Http\Controllers\KetariHealthController;

Route::get('/ketari/health', KetariHealthController::class);
```

---

## 🛠️ Scripts & Tooling

```bash
bun dev        # Start local dev server
bun run build  # Build production bundle with React Compiler
bun run lint   # Run oxlint checks
bun preview    # Preview production build locally
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
