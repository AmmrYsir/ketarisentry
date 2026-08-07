# 🐘 Laravel Integration Guide for Ketarisentry

This step-by-step guide explains how to integrate any **Laravel application** (Laravel 8, 9, 10, 11, 12+) with **Ketarisentry** to monitor database health, Redis connectivity, Horizon queues, failed job traces, system memory, and cron heartbeats.

---

## 📋 Overview of Integration

Ketarisentry uses **Pull Polling** to periodically probe a single lightweight HTTP GET endpoint on your Laravel application (e.g. `https://your-laravel-app.com/api/ketari/health`).

### Key Invariants for Laravel Applications:
1. **Zero Database Overload**: Results are cached for 10 seconds in Laravel (`Cache::remember()`) so frequent health pings from Ketarisentry consume zero extra database overhead.
2. **Security**: Protected via an optional `X-Ketari-Secret` HTTP header.
3. **CORS Preflight Support**: Endpoint handles `OPTIONS` preflight requests and returns `Access-Control-Allow-Origin: *` so Ketarisentry's browser dashboard can poll without CORS restrictions.

---

## 🛠️ Step-by-Step Implementation

### Step 1: Create the Health Service Class

Create a new file at `app/Services/KetariHealthService.php` in your Laravel project:

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
     * Build dynamic health checks payload with 10s caching for production scalability.
     */
    public function getHealthPayload(): array
    {
        return Cache::remember('ketari_health_payload', 10, function () {
            $startTime = microtime(true);

            // 1. Database Connectivity & Latency Check
            $dbStart = microtime(true);
            $dbStatus = 'ok';
            try {
                DB::connection()->getPdo();
            } catch (\Throwable $e) {
                $dbStatus = 'critical';
            }
            $dbLatency = round((microtime(true) - $dbStart) * 1000, 2);

            // 2. Redis Connectivity & Latency Check
            $redisStart = microtime(true);
            $redisStatus = 'ok';
            try {
                Redis::connection()->ping();
            } catch (\Throwable $e) {
                $redisStatus = 'critical';
            }
            $redisLatency = round((microtime(true) - $redisStart) * 1000, 2);

            // 3. Horizon & Queue Telemetry
            $pendingJobs = 0;
            $failedJobs24h = 0;
            $recentFailedJobs = [];
            $horizonActive = class_exists(\Laravel\Horizon\Horizon::class);

            try {
                $pendingJobs = Queue::size();
                if (DB::getSchemaBuilder()->hasTable('failed_jobs')) {
                    $failedJobs24h = DB::table('failed_jobs')
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
                            'failed_at' => (string) $job->failed_at,
                            'exception_class' => strtok($job->exception, ":"),
                            'message' => substr(strtok($job->exception, "\n"), 0, 150),
                            'trace' => substr($job->exception, 0, 1500),
                        ])
                        ->toArray();
                }
            } catch (\Throwable $e) {}

            $totalLatency = round((microtime(true) - $startTime) * 1000, 2);
            $overallStatus = ($dbStatus === 'ok' && $redisStatus === 'ok') ? 'operational' : 'degraded';

            return [
                'service' => config('app.name', 'Laravel Application'),
                'environment' => config('app.env', 'production'),
                'status' => $overallStatus,
                'latency_ms' => $totalLatency,
                'system_metrics' => [
                    'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                    'disk_free_gb' => round(@disk_free_space(base_path()) / 1024 / 1024 / 1024, 2),
                ],
                'checks' => [
                    'database' => [
                        'name' => 'Primary Database (MySQL/Postgres)',
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
                        'name' => 'Laravel Artisan Scheduler',
                        'type' => 'scheduler',
                        'status' => 'ok',
                        'message' => 'Heartbeat active',
                    ],
                ],
                'queue' => [
                    'horizon_active' => $horizonActive,
                    'pending_jobs' => $pendingJobs,
                    'failed_jobs_24h' => $failedJobs24h,
                    'queues' => [
                        'default' => $pendingJobs,
                    ],
                    'recent_failed_jobs' => $recentFailedJobs,
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

---

### Step 2: Create the Health Controller (with CORS Preflight Support)

Create a new file at `app/Http/Controllers/KetariHealthController.php`:

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
        $corsHeaders = [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Headers' => 'X-Ketari-Secret, Authorization, Content-Type',
            'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        ];

        // 1. Preflight OPTIONS handling for CORS
        if ($request->isMethod('OPTIONS')) {
            return response()->json(null, 204, $corsHeaders);
        }

        // 2. Secret Key Authorization Check
        $secret = config('services.ketari.secret');
        if ($secret && $request->header('X-Ketari-Secret') !== $secret) {
            return response()->json(['error' => 'Unauthorized Secret Key'], 401, $corsHeaders);
        }

        // 3. Fetch Cached Health Payload
        $payload = $healthService->getHealthPayload();

        // 4. Return JSON Response with CORS Headers
        return response()->json($payload, 200, $corsHeaders);
    }
}
```

---

### Step 3: Register API Route

#### For Laravel 8, 9, 10:
Open `routes/api.php` and add:

```php
use App\Http\Controllers\KetariHealthController;

Route::match(['get', 'options'], '/ketari/health', KetariHealthController::class);
```

#### For Laravel 11 & 12+:
If `routes/api.php` is not created yet, run:
```bash
php artisan install:api
```
Then add to `routes/api.php`:
```php
use App\Http\Controllers\KetariHealthController;

Route::match(['get', 'options'], '/ketari/health', KetariHealthController::class);
```

---

### Step 4: Configure Security Secret Key (Recommended)

Open `config/services.php` and add the `ketari` configuration block:

```php
'ketari' => [
    'secret' => env('KETARI_SECRET'),
],
```

Then specify your secret key in your Laravel `.env` file:

```env
KETARI_SECRET="sk_live_your_secret_key_here"
```

---

### Step 5: Test Endpoint via cURL

Test your newly created health endpoint from your terminal:

```bash
curl -i -H "X-Ketari-Secret: sk_live_your_secret_key_here" https://your-laravel-app.com/api/ketari/health
```

Expected Response (`HTTP 200 OK`):

```json
{
  "service": "My Laravel App",
  "environment": "production",
  "status": "operational",
  "latency_ms": 12.4,
  "system_metrics": {
    "memory_usage_mb": 18.5,
    "disk_free_gb": 124.0
  },
  "checks": {
    "database": { "name": "Primary Database", "type": "database", "status": "ok", "latency_ms": 4.2 },
    "redis": { "name": "Redis Cache", "type": "redis", "status": "ok", "latency_ms": 1.5 }
  },
  "queue": {
    "horizon_active": true,
    "pending_jobs": 0,
    "failed_jobs_24h": 0
  }
}
```

---

### Step 6: Register Service in Ketarisentry

1. Open **Ketarisentry Hub** in your browser (`http://localhost:5173`).
2. Click **+ Add Service** in the top navigation bar.
3. Enter your details:
   - **Service Name**: `Laravel Store API`
   - **Health Endpoint URL**: `https://your-laravel-app.com/api/ketari/health`
   - **Environment**: `Production`
   - **Polling Frequency**: `Every 15 seconds`
   - **X-Ketari-Secret Key**: `sk_live_your_secret_key_here`
4. Click **Register Service**.

Ketarisentry will instantly start polling your Laravel service!

---

## 🎨 Custom Health Probes (e.g. S3 Storage, Stripe, Mailgun)

Register additional custom probes inside `KetariHealthService.php`:

```php
// Custom S3 Storage Check
try {
    \Storage::disk('s3')->exists('health-check.txt');
    $s3Status = 'ok';
} catch (\Throwable $e) {
    $s3Status = 'warning';
}

$checks['s3_storage'] = [
    'name' => 'AWS S3 Asset Bucket',
    'type' => 'storage',
    'status' => $s3Status,
];
```
