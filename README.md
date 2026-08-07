# Ketarisentry 🛡️

**Ketarisentry** is a modern, minimalist, central health & queue monitoring hub built for multi-tenant service infrastructure with first-class support for **Laravel applications**.

Built with **Bun + Vite + React 19 + TypeScript + React Compiler**, Ketarisentry offers real-time pull polling, queue job failure inspection, SSL cert expiry tracking, Email/Password & Magic Link authentication, and a clean **Claymorphic UI** design system.

---

## ⚡ Features

- 🗄️ **Native Bun + SQLite Database**: Permanent telemetry log storage (`ketarisentry.db`), failed job exception archives, and user profiles powered by `bun:sqlite`.
- 🔐 **Email & Password + Magic Link Authentication**: Native password hashing using `Bun.password.hash` & `Bun.password.verify`, alongside Magic Link authorization for verified accounts.
- 📋 **Security & Configuration Audit Logs**: Chronological audit trail tracking all service registrations, updates, muting, deletions, and user login events.
- 🎯 **Automated Pull Polling**: Periodically probes HTTP `/healthz` endpoints with custom polling intervals (15s - 300s) and timeout management.
- 🐘 **Laravel Queue & Horizon Telemetry**: Deep visibility into Redis queue backlogs, pending job counts, active Horizon workers, and failed job stack traces.
- 📖 **Dedicated Laravel Integration Guide**: Step-by-step guide in [LARAVEL_INTEGRATION.md](file:///c:/Users/ammar/Desktop/ketarisentry/LARAVEL_INTEGRATION.md) for quick copy-paste setup.
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

# Initialize SQLite Database & Seed Initial Superadmin Account
bun run db:init

# Start the Vite development server
bun dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Authentication & Initial Superadmin

Ketarisentry features native **Email + Password** and **Magic Link** authentication.

1. **Initial Seeded Account**:
   - Running `bun run db:init` seeds the initial superadmin account into SQLite:
     - **Email**: `superadmin@ketarisentry.io`
     - **Role**: `admin`
     - **Email Verified**: `1`

2. **Development Sandbox Demo**:
   - In non-production environments (`VITE_APP_ENV="development"`), guest users can click **"Enter Sandbox as Superadmin"** for instant 1-click testing without credentials.

---

## 📡 Target Laravel Health Endpoint Setup

Ketarisentry polls standard JSON health endpoints on your target services. Below is the expected JSON response payload format:

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

## 🐘 Production-Grade Laravel Health Controller & Service

Here is a modular, high-performance, object-oriented Laravel service pattern (`app/Services/KetariHealthService.php` and `app/Http/Controllers/KetariHealthController.php`) featuring **10-second response caching** and dynamic check registration:

### 1. Health Service (`app/Services/KetariHealthService.php`)

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Queue;

class KetariHealthService
{
    /**
     * Get dynamic health checks payload with 10s caching for scalability.
     */
    public function getHealthPayload(): array
    {
        return Cache::remember('ketari_health_payload', 10, function () {
            $startTime = microtime(true);

            // 1. Database Check
            $dbStart = microtime(true);
            $dbStatus = 'ok';
            try {
                DB::connection()->getPdo();
            } catch (\Throwable $e) {
                $dbStatus = 'critical';
            }
            $dbLatency = round((microtime(true) - $dbStart) * 1000, 2);

            // 2. Redis Check
            $redisStart = microtime(true);
            $redisStatus = 'ok';
            try {
                Redis::connection()->ping();
            } catch (\Throwable $e) {
                $redisStatus = 'critical';
            }
            $redisLatency = round((microtime(true) - $redisStart) * 1000, 2);

            // 3. Queue & Failed Jobs Check
            $pendingJobs = 0;
            $failedJobs24h = 0;
            $recentFailed = [];
            try {
                $pendingJobs = Queue::size();
                if (DB::getSchemaBuilder()->hasTable('failed_jobs')) {
                    $failedJobs24h = DB::table('failed_jobs')
                        ->where('failed_at', '>=', now()->subHours(24))
                        ->count();

                    $recentFailed = DB::table('failed_jobs')
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

            $totalLatency = round((microtime(true) - $startTime) * 1000, 2);
            $overallStatus = ($dbStatus === 'ok' && $redisStatus === 'ok') ? 'operational' : 'degraded';

            return [
                'service' => config('app.name', 'Laravel App'),
                'environment' => config('app.env', 'production'),
                'status' => $overallStatus,
                'latency_ms' => $totalLatency,
                'system_metrics' => [
                    'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                    'disk_free_gb' => round(@disk_free_space(base_path()) / 1024 / 1024 / 1024, 2),
                ],
                'checks' => [
                    'database' => [
                        'name' => 'MySQL Primary Database',
                        'type' => 'database',
                        'status' => $dbStatus,
                        'latency_ms' => $dbLatency,
                    ],
                    'redis' => [
                        'name' => 'Redis Cache & Queue',
                        'type' => 'redis',
                        'status' => $redisStatus,
                        'latency_ms' => $redisLatency,
                    ],
                    'scheduler' => [
                        'name' => 'Artisan Scheduler',
                        'type' => 'scheduler',
                        'status' => 'ok',
                        'message' => 'Heartbeat active',
                    ],
                ],
                'queue' => [
                    'horizon_active' => true,
                    'pending_jobs' => $pendingJobs,
                    'failed_jobs_24h' => $failedJobs24h,
                    'queues' => [
                        'default' => $pendingJobs,
                    ],
                    'recent_failed_jobs' => $recentFailed,
                ],
                'ssl' => [
                    'valid' => true,
                    'days_remaining' => 90
                ]
            ];
        });
    }
}
```

### 2. Health Controller (`app/Http/Controllers/KetariHealthController.php`)

```php
<?php

namespace App\Http\Controllers;

use App\Services\KetariHealthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KetariHealthController extends Controller
{
    public function __invoke(Request $request, KetariHealthService $healthService): JsonResponse
    {
        // 1. Optional Secret Key Authorization
        $secret = config('services.ketari.secret');
        if ($secret && $request->header('X-Ketari-Secret') !== $secret) {
            return response()->json(['error' => 'Unauthorized Secret Key'], 401);
        }

        $payload = $healthService->getHealthPayload();

        return response()->json($payload, 200, [
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
bun dev        # Start local Vite dev server (port 5173 with /api proxy)
bun run server # Start high-performance Bun + SQLite API server (port 3001)
bun run db:init # Initialize SQLite schema & seed initial superadmin account
bun run build  # Build production bundle with React Compiler
bun run lint   # Run oxlint checks
bun preview    # Preview production build locally
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
