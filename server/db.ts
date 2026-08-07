import { Database } from 'bun:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import type { ServiceConfig, PollResult, AuditLogEntry, AuthUser, DynamicCheck, FailedJobTrace } from '../src/types';

// Ensure .env file exists by copying .env.example if missing
if (!fs.existsSync('.env') && fs.existsSync('.env.example')) {
  try {
    fs.copyFileSync('.env.example', '.env');
    console.log('📄 Automatically created .env from .env.example');
  } catch {
    // Ignore error
  }
}

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
export async function initializeSchema(): Promise<void> {
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
      enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      avatar TEXT,
      role TEXT NOT NULL,
      email_verified INTEGER DEFAULT 1,
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

  // Seed default superadmin account if users table is empty or superadmin does not exist
  const existingSuperadmin = db.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get('superadmin@ketarisentry.io');
  if (!existingSuperadmin) {
    const defaultPasswordHash = await Bun.password.hash('admin');
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, password_hash, avatar, role, email_verified, is_sandbox, last_login_at)
      VALUES ($id, $name, $email, $password_hash, $avatar, $role, $email_verified, $is_sandbox, $last_login_at)
    `).run({
      $id: 'usr_superadmin_1',
      $name: 'System Superadmin',
      $email: 'superadmin@ketarisentry.io',
      $password_hash: defaultPasswordHash,
      $avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Superadmin',
      $role: 'admin',
      $email_verified: 1,
      $is_sandbox: 0,
      $last_login_at: new Date().toISOString(),
    });
  }

  addAuditLog({
    user_id: 'system',
    user_name: 'Database Initializer',
    action: 'INIT_DATABASE',
    details: 'Database schema initialized & superadmin account seeded (superadmin@ketarisentry.io)',
    timestamp: new Date().toISOString(),
  });
}

// Run schema setup automatically
initializeSchema();

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
    enabled: r.enabled !== undefined ? Boolean(r.enabled) : true,
    created_at: r.created_at,
  }));
}

export function saveServiceToDb(service: ServiceConfig): void {
  const existing = db.query('SELECT id FROM services WHERE id = ?').get(service.id);
  const isEnabled = service.enabled !== undefined ? (service.enabled ? 1 : 0) : 1;

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
        muted = $muted,
        enabled = $enabled
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
      $enabled: isEnabled,
    });
  } else {
    db.prepare(`
      INSERT INTO services (id, name, url, environment, poll_interval_sec, timeout_sec, secret_key, auth_header, muted, enabled, created_at)
      VALUES ($id, $name, $url, $environment, $poll_interval_sec, $timeout_sec, $secret_key, $auth_header, $muted, $enabled, $created_at)
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
      $enabled: isEnabled,
      $created_at: service.created_at || new Date().toISOString(),
    });
  }
}

export function deleteServiceFromDb(id: string): void {
  db.prepare('DELETE FROM services WHERE id = ?').run(id);
}

// Telemetry & Poll Log queries
export function recordPollLog(result: PollResult): void {
  const allChecks: DynamicCheck[] = Object.values(result.checks || {});
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
    result.queue.recent_failed_jobs.forEach((job: FailedJobTrace) => {
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

// User & Auth queries
export function findUserByEmail(email: string): (AuthUser & { password_hash?: string }) | null {
  const row = db.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password_hash: row.password_hash,
    avatar: row.avatar || undefined,
    role: row.role,
    email_verified: Boolean(row.email_verified),
    is_sandbox: Boolean(row.is_sandbox),
  };
}

export async function authenticateUserWithPassword(email: string, password: string): Promise<AuthUser | null> {
  const user = findUserByEmail(email);
  if (!user || !user.password_hash) return null;

  const isMatch = await Bun.password.verify(password, user.password_hash);
  if (!isMatch) return null;

  // Update last login timestamp
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    email_verified: user.email_verified,
    is_sandbox: user.is_sandbox,
  };
}

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
    $avatar: user.avatar || null,
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
