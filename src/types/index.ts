export type HealthStatus = 'operational' | 'degraded' | 'outage' | 'maintenance';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface ServiceCheck {
  status: 'ok' | 'failed' | 'warning';
  latency_ms: number;
  free_gb?: number;
  message?: string;
}

export interface FailedJobTrace {
  id: string;
  job_name: string;
  queue: string;
  failed_at: string;
  exception_class: string;
  message: string;
  trace: string;
}

export interface QueueMetrics {
  horizon_active: boolean;
  pending_jobs: number;
  failed_jobs_24h: number;
  queues: Record<string, number>;
  recent_failed_jobs?: FailedJobTrace[];
}

export interface SSLMetrics {
  valid: boolean;
  days_remaining: number;
  expires_at?: string;
}

export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  environment: 'production' | 'staging' | 'local';
  poll_interval_sec: number;
  timeout_sec: number;
  auth_header?: string;
  secret_key?: string;
  muted: boolean;
  created_at: string;
}

export interface PollResult {
  service_id: string;
  status: HealthStatus;
  latency_ms: number;
  checks: Record<string, ServiceCheck>;
  queue: QueueMetrics;
  ssl: SSLMetrics;
  polled_at: string;
  error_message?: string;
  latency_history: number[];
}

export interface ServiceWithStatus {
  config: ServiceConfig;
  lastResult?: PollResult;
}

export interface Incident {
  id: string;
  service_id: string;
  service_name: string;
  previous_status: HealthStatus;
  new_status: HealthStatus;
  reason: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  domain?: string;
  role: UserRole;
  is_sandbox: boolean;
}
