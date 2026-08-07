import { Database } from 'bun:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import type { ServiceConfig, PollResult, AuditLogEntry, AuthUser } from '../src/types';

const dbPath = process.env.DB_PATH || 'database/ketarisentry.db';
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, { create: true });

// Enable WAL mode for high concurrency performance
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables
export function initializeSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      environment TEXT NOT NULL,
      poll_interval_sec INTEGER DEFAULT 15,
      timeout_sec INTEGER DEFAULT 5,
      secret_key TEXT,
      auth_header TEXT,
      muted INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar TEXT,
      role TEXT NOT NULL,
      is_sandbox INTEGER DEFAULT 0,
      last_login_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS poll_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id TEXT NOT NULL,
      status TEXT NOT NULL,
      latency_ms INTEGER NOT NULL,
      db_status TEXT,
      redis_status TEXT,
      pending_jobs INTEGER DEFAULT 0,
      failed_jobs_24h INTEGER DEFAULT 0,
      ssl_days_remaining INTEGER,
      error_message TEXT,
      polled_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS failed_jobs_history (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      job_name TEXT NOT NULL,
      queue TEXT NOT NULL,
      failed_at TEXT NOT NULL,
      exception_class TEXT NOT NULL,
      message TEXT NOT NULL,
      trace TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);
}

// Run schema setup automatically
initializeSchema();

// Populate initial services if table is empty
const serviceCountQuery = db.query('SELECT COUNT(*) as count FROM services');
const countResult = serviceCountQuery.get() as { count: number };

if (countResult.count === 0) {
  seedDefaultData();
}

export function seedDefaultData(): void {
  const insertService = db.prepare(`
    INSERT OR IGNORE INTO services (id, name, url, environment, poll_interval_sec, timeout_sec, secret_key, muted, created_at)
    VALUES ($id, $name, $url, $environment, $poll_interval_sec, $timeout_sec, $secret_key, $muted, $created_at)
  `);

  insertService.run({
    $id: 'srv-1',
    $name: 'Laravel E-Commerce API',
    $url: 'https://api.store.example.com/ketari/health',
    $environment: 'production',
    $poll_interval_sec: 15,
    $timeout_sec: 5,
    $secret_key: 'sk_live_998124719',
    $muted: 0,
    $created_at: new Date().toISOString(),
  });

  insertService.run({
    $id: 'srv-2',
    $name: 'Payment Processing Worker',
    $url: 'https://pay-worker.example.com/api/health',
    $environment: 'production',
    $poll_interval_sec: 30,
    $timeout_sec: 5,
    $secret_key: null,
    $muted: 0,
    $created_at: new Date().toISOString(),
  });

  insertService.run({
    $id: 'srv-3',
    $name: 'Notification & Email Queue',
    $url: 'https://notify.example.com/ketari/health',
    $environment: 'staging',
    $poll_interval_sec: 30,
    $timeout_sec: 5,
    $secret_key: null,
    $muted: 0,
    $created_at: new Date().toISOString(),
  });

  addAuditLog({
    user_id: 'system',
    user_name: 'Database Initializer',
    action: 'INIT_DATABASE',
    details: 'Database tables initialized & default services seeded',
    timestamp: new Date().toISOString(),
  });
}

// Service queries
export function getAllServices(): ServiceConfig[] {
  const query = db.query('SELECT * FROM services ORDER BY created_at ASC');
  const rows = query.all() as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    environment: r.environment,
    poll_interval_sec: r.poll_interval_sec,
    timeout_sec: r.timeout_sec,
    secret_key: r.secret_key || undefined,
    auth_header: r.auth_header || undefined,
    muted: Boolean(r.muted),
    created_at: r.created_at,
  }));
}

export function saveServiceToDb(service: ServiceConfig): void {
  const existing = db.query('SELECT id FROM services WHERE id = ?').get(service.id);
  if (existing) {
    db.prepare(`
      UPDATE services SET
        name = $name,
        url = $url,
        environment = $environment,
        poll_interval_sec = $poll_interval_sec,
        timeout_sec = $timeout_sec,
        secret_key = $secret_key,
        auth_header = $auth_header,
        muted = $muted
      WHERE id = $id
    `).run({
      $id: service.id,
      $name: service.name,
      $url: service.url,
      $environment: service.environment,
      $poll_interval_sec: service.poll_interval_sec,
      $timeout_sec: service.timeout_sec,
      $secret_key: service.secret_key || null,
      $auth_header: service.auth_header || null,
      $muted: service.muted ? 1 : 0,
    });
  } else {
    db.prepare(`
      INSERT INTO services (id, name, url, environment, poll_interval_sec, timeout_sec, secret_key, auth_header, muted, created_at)
      VALUES ($id, $name, $url, $environment, $poll_interval_sec, $timeout_sec, $secret_key, $auth_header, $muted, $created_at)
    `).run({
      $id: service.id,
      $name: service.name,
      $url: service.url,
      $environment: service.environment,
      $poll_interval_sec: service.poll_interval_sec,
      $timeout_sec: service.timeout_sec,
      $secret_key: service.secret_key || null,
      $auth_header: service.auth_header || null,
      $muted: service.muted ? 1 : 0,
      $created_at: service.created_at || new Date().toISOString(),
    });
  }
}

export function deleteServiceFromDb(id: string): void {
  db.prepare('DELETE FROM services WHERE id = ?').run(id);
}

// Telemetry & Poll Log queries
export function recordPollLog(result: PollResult): void {
  const allChecks = Object.values(result.checks || {});
  const dbCheck = allChecks.find((c) => c.type === 'database');
  const redisCheck = allChecks.find((c) => c.type === 'redis');

  db.prepare(`
    INSERT INTO poll_logs (service_id, status, latency_ms, db_status, redis_status, pending_jobs, failed_jobs_24h, ssl_days_remaining, error_message, polled_at)
    VALUES ($service_id, $status, $latency_ms, $db_status, $redis_status, $pending_jobs, $failed_jobs_24h, $ssl_days_remaining, $error_message, $polled_at)
  `).run({
    $service_id: result.service_id,
    $status: result.status,
    $latency_ms: result.latency_ms,
    $db_status: dbCheck?.status || 'ok',
    $redis_status: redisCheck?.status || 'ok',
    $pending_jobs: result.queue?.pending_jobs || 0,
    $failed_jobs_24h: result.queue?.failed_jobs_24h || 0,
    $ssl_days_remaining: result.ssl?.days_remaining || 90,
    $error_message: result.error_message || null,
    $polled_at: result.polled_at,
  });

  if (result.queue?.recent_failed_jobs) {
    const insertFailedJob = db.prepare(`
      INSERT OR REPLACE INTO failed_jobs_history (id, service_id, job_name, queue, failed_at, exception_class, message, trace, recorded_at)
      VALUES ($id, $service_id, $job_name, $queue, $failed_at, $exception_class, $message, $trace, $recorded_at)
    `);
    result.queue.recent_failed_jobs.forEach((job) => {
      insertFailedJob.run({
        $id: job.id,
        $service_id: result.service_id,
        $job_name: job.job_name,
        $queue: job.queue,
        $failed_at: job.failed_at,
        $exception_class: job.exception_class,
        $message: job.message,
        $trace: job.trace,
        $recorded_at: new Date().toISOString(),
      });
    });
  }
}

export function getRecentPollLogs(serviceId: string, limit = 10): any[] {
  const query = db.query(`
    SELECT * FROM poll_logs 
    WHERE service_id = ? 
    ORDER BY id DESC 
    LIMIT ?
  `);
  return query.all(serviceId, limit);
}

// User queries
export function upsertUser(user: AuthUser): void {
  db.prepare(`
    INSERT INTO users (id, name, email, avatar, role, is_sandbox, last_login_at)
    VALUES ($id, $name, $email, $avatar, $role, $is_sandbox, $last_login_at)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      avatar = excluded.avatar,
      role = excluded.role,
      last_login_at = excluded.last_login_at
  `).run({
    $id: user.id,
    $name: user.name,
    $email: user.email,
    $avatar: user.avatar,
    $role: user.role,
    $is_sandbox: user.is_sandbox ? 1 : 0,
    $last_login_at: new Date().toISOString(),
  });
}

// Audit Log queries
export function addAuditLog(entry: Omit<AuditLogEntry, 'id'>): void {
  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, details, timestamp)
    VALUES ($user_id, $user_name, $action, $details, $timestamp)
  `).run({
    $user_id: entry.user_id,
    $user_name: entry.user_name,
    $action: entry.action,
    $details: entry.details,
    $timestamp: entry.timestamp || new Date().toISOString(),
  });
}

export function getAllAuditLogs(limit = 50): AuditLogEntry[] {
  const query = db.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?');
  const rows = query.all(limit) as any[];
  return rows.map((r) => ({
    id: String(r.id),
    user_id: r.user_id,
    user_name: r.user_name,
    action: r.action,
    details: r.details,
    timestamp: r.timestamp,
  }));
}

export { db, dbPath };
