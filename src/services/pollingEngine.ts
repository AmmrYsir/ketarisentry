import type { ServiceConfig, PollResult, HealthStatus, FailedJobTrace, DynamicCheck } from '../types';

export const INITIAL_SERVICES: ServiceConfig[] = [
  {
    id: 'srv-1',
    name: 'Laravel E-Commerce API',
    url: 'https://api.store.example.com/ketari/health',
    environment: 'production',
    poll_interval_sec: 15,
    timeout_sec: 5,
    secret_key: 'sk_live_998124719',
    muted: false,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-2',
    name: 'Payment Processing Worker',
    url: 'https://pay-worker.example.com/api/health',
    environment: 'production',
    poll_interval_sec: 30,
    timeout_sec: 5,
    muted: false,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-3',
    name: 'Notification & Email Queue',
    url: 'https://notify.example.com/ketari/health',
    environment: 'staging',
    poll_interval_sec: 30,
    timeout_sec: 5,
    muted: false,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-4',
    name: 'Reporting & Analytics Service',
    url: 'https://analytics.example.com/healthz',
    environment: 'production',
    poll_interval_sec: 60,
    timeout_sec: 10,
    muted: false,
    enabled: true,
    created_at: new Date().toISOString(),
  },
];

const MOCK_FAILED_JOBS: Record<string, FailedJobTrace[]> = {
  'srv-1': [
    {
      id: 'job-101',
      job_name: 'App\\Jobs\\SyncInventoryWithERP',
      queue: 'default',
      failed_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      exception_class: 'Illuminate\\Http\\Client\\ConnectionException',
      message: 'cURL error 28: Connection timed out after 5000 milliseconds to ERP endpoint',
      trace: `Illuminate\\Http\\Client\\ConnectionException: cURL error 28: Connection timed out after 5000 milliseconds to ERP endpoint
  at /var/www/html/vendor/laravel/framework/src/Illuminate/Http/Client/PendingRequest.php:876
  at App\\Services\\ErpClient->syncInventory() at /var/www/html/app/Jobs/SyncInventoryWithERP.php:42
  at App\\Jobs\\SyncInventoryWithERP->handle() at /var/www/html/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php:36`,
    },
    {
      id: 'job-102',
      job_name: 'App\\Jobs\\SendOrderConfirmationMail',
      queue: 'emails',
      failed_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      exception_class: 'Symfony\\Component\\Mailer\\Exception\\TransportException',
      message: 'Unable to connect with STARTTLS: SMTP response code 530 auth required',
      trace: `Symfony\\Component\\Mailer\\Exception\\TransportException: Unable to connect with STARTTLS
  at /var/www/html/vendor/symfony/mailer/Transport/Smtp/SmtpTransport.php:145
  at Illuminate\\Mail\\Mailer->send() at /var/www/html/app/Jobs/SendOrderConfirmationMail.php:58`,
    },
  ],
  'srv-2': [
    {
      id: 'job-201',
      job_name: 'App\\Jobs\\ProcessStripeWebhook',
      queue: 'high-priority',
      failed_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      exception_class: 'Stripe\\Exception\\SignatureVerificationException',
      message: 'No signatures found matching the expected signature for payload header',
      trace: `Stripe\\Exception\\SignatureVerificationException: No signatures found matching the expected signature
  at /var/www/html/vendor/stripe/stripe-php/lib/WebhookSignature.php:68
  at App\\Jobs\\ProcessStripeWebhook->handle() at /var/www/html/app/Jobs/ProcessStripeWebhook.php:39`,
    },
  ],
};

export async function executePullPoll(config: ServiceConfig): Promise<PollResult> {
  if (config.muted) {
    return {
      service_id: config.id,
      status: 'maintenance',
      latency_ms: 0,
      checks: {},
      queue: {
        horizon_active: false,
        pending_jobs: 0,
        failed_jobs_24h: 0,
        queues: {},
      },
      ssl: { valid: true, days_remaining: 365 },
      polled_at: new Date().toISOString(),
      latency_history: [0, 0, 0, 0, 0],
    };
  }

  // Detect demo / placeholder mock domains
  const isMockDomain =
    config.url.includes('example.com') ||
    config.url.includes('demo') ||
    config.id.startsWith('srv-');

  // For initial demo services, instantly return realistic interactive telemetry
  if (isMockDomain) {
    return generateMockPollResult(config);
  }

  // Real HTTP Pull Probe execution for custom added services
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout_sec * 1000);

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (config.secret_key) {
      headers['X-Ketari-Secret'] = config.secret_key;
    }
    if (config.auth_header) {
      headers['Authorization'] = config.auth_header;
    }

    const response = await fetch(config.url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (response.ok) {
      const data = await response.json();
      return {
        service_id: config.id,
        status: data.status || deriveOverallStatus(data.checks),
        latency_ms: data.latency_ms || latency,
        checks: data.checks || getFallbackChecks(),
        system_metrics: data.system_metrics,
        queue: data.queue || {
          horizon_active: true,
          pending_jobs: 0,
          failed_jobs_24h: 0,
          queues: { default: 0 },
        },
        ssl: data.ssl || { valid: true, days_remaining: 90 },
        polled_at: new Date().toISOString(),
        latency_history: generateLatencyHistory(data.latency_ms || latency),
      };
    } else {
      return {
        service_id: config.id,
        status: 'degraded',
        latency_ms: latency,
        checks: {
          http_probe: {
            name: 'HTTP Health Endpoint',
            type: 'system',
            status: 'warning',
            latency_ms: latency,
            message: `HTTP Error ${response.status}: ${response.statusText}`,
          },
        },
        queue: {
          horizon_active: false,
          pending_jobs: 0,
          failed_jobs_24h: 0,
          queues: {},
        },
        ssl: { valid: true, days_remaining: 30 },
        polled_at: new Date().toISOString(),
        error_message: `HTTP ${response.status}: ${response.statusText}`,
        latency_history: generateLatencyHistory(latency),
      };
    }
  } catch (err: any) {
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    const errorMessage = err?.name === 'AbortError' 
      ? `Request timed out after ${config.timeout_sec}s`
      : err?.message || 'Connection failed / Network error';

    return {
      service_id: config.id,
      status: 'outage',
      latency_ms: latency,
      checks: {
        network_probe: {
          name: 'Target Service Connection',
          type: 'system',
          status: 'critical',
          latency_ms: latency,
          message: errorMessage,
        },
      },
      queue: {
        horizon_active: false,
        pending_jobs: 0,
        failed_jobs_24h: 0,
        queues: {},
      },
      ssl: { valid: false, days_remaining: 0 },
      polled_at: new Date().toISOString(),
      error_message: errorMessage,
      latency_history: generateLatencyHistory(latency),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function deriveOverallStatus(checks?: Record<string, DynamicCheck>): HealthStatus {
  if (!checks) return 'operational';
  const values = Object.values(checks);
  if (values.some((c) => c.status === 'critical')) return 'outage';
  if (values.some((c) => c.status === 'warning')) return 'degraded';
  return 'operational';
}

function getFallbackChecks(): Record<string, DynamicCheck> {
  return {
    database: { name: 'Database', type: 'database', status: 'ok', latency_ms: 4 },
    redis: { name: 'Redis Cache', type: 'redis', status: 'ok', latency_ms: 2 },
  };
}

function generateMockPollResult(config: ServiceConfig): PollResult {
  const isSrv2 = config.id === 'srv-2';
  const isSrv3 = config.id === 'srv-3';

  let status: HealthStatus = 'operational';
  let latency = Math.floor(Math.random() * 35) + 15;
  let pendingJobs = Math.floor(Math.random() * 20) + 2;
  let failedJobs24h = 0;
  let sslDays = 65;

  const checks: Record<string, DynamicCheck> = {
    database: {
      name: 'MySQL Primary',
      type: 'database',
      status: 'ok',
      latency_ms: Math.round(latency * 0.2),
    },
    redis: {
      name: 'Redis Cache',
      type: 'redis',
      status: 'ok',
      latency_ms: Math.round(latency * 0.1),
    },
    storage: {
      name: 'Local Storage',
      type: 'storage',
      status: 'ok',
      details: { free_gb: 184 },
    },
  };

  if (isSrv2) {
    status = 'degraded';
    latency = Math.floor(Math.random() * 80) + 180;
    failedJobs24h = 1;
    pendingJobs = 34;
    sslDays = 12; // Trigger SSL warning

    checks['stripe_api'] = {
      name: 'Stripe Gateway',
      type: 'external_api',
      status: 'warning',
      latency_ms: 450,
      message: 'Elevated API response time > 400ms',
    };
  } else if (isSrv3) {
    failedJobs24h = 2;
    pendingJobs = 8;

    checks['scheduler'] = {
      name: 'Laravel Cron Scheduler',
      type: 'scheduler',
      status: 'ok',
      message: 'Heartbeat active (30s ago)',
    };
  }

  const failedTraces = MOCK_FAILED_JOBS[config.id] || [];

  return {
    service_id: config.id,
    status,
    latency_ms: latency,
    checks,
    system_metrics: {
      memory_usage_mb: Math.floor(Math.random() * 40) + 120,
      cpu_load_percent: Math.floor(Math.random() * 25) + 10,
      disk_free_gb: 148,
    },
    queue: {
      horizon_active: true,
      pending_jobs: pendingJobs,
      failed_jobs_24h: failedJobs24h,
      queues: {
        default: Math.ceil(pendingJobs * 0.6),
        'high-priority': Math.floor(pendingJobs * 0.4),
      },
      recent_failed_jobs: failedTraces,
    },
    ssl: {
      valid: true,
      days_remaining: sslDays,
    },
    polled_at: new Date().toISOString(),
    latency_history: generateLatencyHistory(latency),
  };
}

function generateLatencyHistory(baseLatency: number): number[] {
  return Array.from({ length: 6 }, () =>
    Math.max(10, Math.round(baseLatency + (Math.random() * 24 - 12)))
  );
}
