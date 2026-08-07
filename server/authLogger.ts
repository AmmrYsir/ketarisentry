import fs from 'node:fs';
import path from 'node:path';

const LOG_DIR = path.resolve('logs');
const AUTH_LOG_PATH = path.join(LOG_DIR, 'auth.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log fail2ban-compatible authentication events.
 * Format: YYYY-MM-DD HH:mm:ss [FAIL2BAN] <EVENT_TYPE> IP=<client_ip> EMAIL=<email> REASON="<message>"
 */
export function logAuthEvent(
  eventType: 'AUTH_FAIL' | 'RATE_LIMIT' | 'AUTH_SUCCESS',
  ip: string,
  email: string,
  reason: string
): void {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logLine = `${timestamp} [FAIL2BAN] ${eventType} IP=${ip} EMAIL=${email || 'unknown'} REASON="${reason}"\n`;

  try {
    fs.appendFileSync(AUTH_LOG_PATH, logLine, 'utf-8');
  } catch (err) {
    console.error('Failed to write auth log:', err);
  }
}

export { AUTH_LOG_PATH };
