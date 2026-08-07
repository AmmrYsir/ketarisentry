import type { ServiceConfig, PollResult, HealthStatus, DynamicCheck } from '../types';

export const INITIAL_SERVICES: ServiceConfig[] = [];

export async function executePullPoll(config: ServiceConfig): Promise<PollResult> {
  const startTime = performance.now();

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), (config.timeout_sec || 5) * 1000);

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
      const derivedStatus = data.status || deriveOverallStatus(data.checks);
      return {
        service_id: config.id,
        status: derivedStatus,
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
    database: { name: 'Database', type: 'database', status: 'ok', latency_ms: 0 },
  };
}

function generateLatencyHistory(baseLatency: number): number[] {
  return Array.from({ length: 6 }, () => Math.max(5, Math.round(baseLatency)));
}
