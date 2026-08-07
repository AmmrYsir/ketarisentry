import { 
  getAllServices, 
  saveServiceToDb, 
  deleteServiceFromDb, 
  recordPollLog, 
  getAllAuditLogs, 
  addAuditLog, 
  upsertUser,
  findUserByEmail,
  authenticateUserWithPassword
} from './db';
import { executePullPoll } from '../src/services/pollingEngine';
import { logAuthEvent } from './authLogger';
import type { ServiceConfig, AuthUser } from '../src/types';

const PORT = process.env.PORT || 3001;

// Rate limiting state: IP -> timestamp attempts array
const loginAttemptsMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_LOGIN_ATTEMPTS = 5; // Max 5 attempts per window

/**
 * In-memory sliding window rate limiter helper
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const attempts = loginAttemptsMap.get(ip) || [];

  // Filter out attempts outside the time window
  const validAttempts = attempts.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (validAttempts.length >= MAX_LOGIN_ATTEMPTS) {
    const oldestInWindow = validAttempts[0];
    const retryAfterSec = Math.ceil((oldestInWindow + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  validAttempts.push(now);
  loginAttemptsMap.set(ip, validAttempts);
  return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - validAttempts.length, retryAfterSec: 0 };
}

console.log(`🛡️ Ketarisentry Bun + SQLite API Server booting on port ${PORT}...`);

Bun.serve({
  port: Number(PORT),
  async fetch(req) {
    const url = new URL(req.url);

    // Extract client IP address securely
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Standard Security & Hardening Headers
    const securityHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ketari-Secret',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: securityHeaders });
    }

    try {
      // 1. GET /api/services
      if (url.pathname === '/api/services' && req.method === 'GET') {
        const services = getAllServices();
        return Response.json(services, { headers: securityHeaders });
      }

      // 2. POST /api/services
      if (url.pathname === '/api/services' && req.method === 'POST') {
        const body = (await req.json()) as { service?: ServiceConfig; user?: AuthUser };
        
        if (!body || !body.service || !body.service.id || !body.service.name || !body.service.url) {
          return Response.json(
            { error: 'Invalid service payload. Mandatory fields: id, name, url.' },
            { status: 400, headers: securityHeaders }
          );
        }

        saveServiceToDb(body.service);

        // Audit Log
        addAuditLog({
          user_id: body.user?.id || 'system',
          user_name: body.user?.name || 'System / Admin',
          action: 'SAVE_SERVICE',
          details: `Saved target service configuration: ${body.service.name} (${body.service.url})`,
          timestamp: new Date().toISOString(),
        });

        return Response.json({ success: true, service: body.service }, { headers: securityHeaders });
      }

      // 3. DELETE /api/services/:id
      if (url.pathname.startsWith('/api/services/') && req.method === 'DELETE') {
        const id = url.pathname.split('/')[3];
        if (!id) {
          return Response.json({ error: 'Service ID is required' }, { status: 400, headers: securityHeaders });
        }

        const servicesBefore = getAllServices();
        const target = servicesBefore.find((s: ServiceConfig) => s.id === id);

        deleteServiceFromDb(id);

        if (target) {
          addAuditLog({
            user_id: 'system',
            user_name: 'Admin User',
            action: 'DELETE_SERVICE',
            details: `Deleted service ${target.name} (ID: ${id})`,
            timestamp: new Date().toISOString(),
          });
        }

        return Response.json({ success: true }, { headers: securityHeaders });
      }

      // 4. POST /api/poll
      if (url.pathname === '/api/poll' && req.method === 'POST') {
        const serviceConfig = (await req.json()) as ServiceConfig;
        
        if (!serviceConfig || !serviceConfig.id || !serviceConfig.url) {
          return Response.json({ error: 'Valid service configuration required' }, { status: 400, headers: securityHeaders });
        }

        const result = await executePullPoll(serviceConfig);

        // Record telemetry log into SQLite
        recordPollLog(result);

        return Response.json(result, { headers: securityHeaders });
      }

      // 5. GET /api/audit-logs
      if (url.pathname === '/api/audit-logs' && req.method === 'GET') {
        const logs = getAllAuditLogs(50);
        return Response.json(logs, { headers: securityHeaders });
      }

      // 6. POST /api/auth/login (Email + Password Authentication with Rate Limiting & Fail2ban Logging)
      if (url.pathname === '/api/auth/login' && req.method === 'POST') {
        const body = (await req.json()) as { email?: string; password?: string };
        const userEmail = body.email || '';

        // Enforce Rate Limit (Max 5 attempts per 15 minutes)
        const rateLimit = checkRateLimit(clientIp);
        if (!rateLimit.allowed) {
          logAuthEvent('RATE_LIMIT', clientIp, userEmail, `Rate limit exceeded. Cooldown: ${rateLimit.retryAfterSec}s`);
          return Response.json(
            { error: `Too many failed authentication attempts. Please try again in ${rateLimit.retryAfterSec} seconds.` },
            { 
              status: 429, 
              headers: { 
                ...securityHeaders, 
                'Retry-After': String(rateLimit.retryAfterSec) 
              } 
            }
          );
        }

        if (!body.email || !body.password) {
          logAuthEvent('AUTH_FAIL', clientIp, userEmail, 'Missing email or password');
          return Response.json({ error: 'Email and password are required' }, { status: 400, headers: securityHeaders });
        }

        const authenticatedUser = await authenticateUserWithPassword(body.email, body.password);
        if (!authenticatedUser) {
          logAuthEvent('AUTH_FAIL', clientIp, userEmail, 'Invalid credentials');
          return Response.json({ error: 'Invalid email address or password' }, { status: 401, headers: securityHeaders });
        }

        logAuthEvent('AUTH_SUCCESS', clientIp, userEmail, `User signed in (Role: ${authenticatedUser.role})`);

        addAuditLog({
          user_id: authenticatedUser.id,
          user_name: authenticatedUser.name,
          action: 'USER_LOGIN',
          details: `User signed in via Email/Password (Role: ${authenticatedUser.role})`,
          timestamp: new Date().toISOString(),
        });

        return Response.json({ success: true, user: authenticatedUser }, { headers: securityHeaders });
      }

      // 7. POST /api/auth/magic-link (Magic Link Authentication with Rate Limiting & Fail2ban Logging)
      if (url.pathname === '/api/auth/magic-link' && req.method === 'POST') {
        const body = (await req.json()) as { email?: string };
        const userEmail = body.email || '';

        // Enforce Rate Limit (Max 5 attempts per 15 minutes)
        const rateLimit = checkRateLimit(clientIp);
        if (!rateLimit.allowed) {
          logAuthEvent('RATE_LIMIT', clientIp, userEmail, `Rate limit exceeded. Cooldown: ${rateLimit.retryAfterSec}s`);
          return Response.json(
            { error: `Too many magic link requests. Please try again in ${rateLimit.retryAfterSec} seconds.` },
            { 
              status: 429, 
              headers: { 
                ...securityHeaders, 
                'Retry-After': String(rateLimit.retryAfterSec) 
              } 
            }
          );
        }

        if (!body.email) {
          logAuthEvent('AUTH_FAIL', clientIp, userEmail, 'Missing email address');
          return Response.json({ error: 'Email address is required' }, { status: 400, headers: securityHeaders });
        }

        const existingUser = findUserByEmail(body.email);
        if (!existingUser || !existingUser.email_verified) {
          logAuthEvent('AUTH_FAIL', clientIp, userEmail, 'No verified account found');
          return Response.json(
            { error: 'No verified account found for this email address' },
            { status: 404, headers: securityHeaders }
          );
        }

        const userPayload: AuthUser = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          avatar: existingUser.avatar,
          role: existingUser.role,
          email_verified: existingUser.email_verified,
          is_sandbox: existingUser.is_sandbox,
        };

        logAuthEvent('AUTH_SUCCESS', clientIp, userEmail, `User signed in via Magic Link (Role: ${userPayload.role})`);

        addAuditLog({
          user_id: userPayload.id,
          user_name: userPayload.name,
          action: 'USER_LOGIN',
          details: `User signed in via Magic Link (Role: ${userPayload.role})`,
          timestamp: new Date().toISOString(),
        });

        return Response.json({ success: true, user: userPayload }, { headers: securityHeaders });
      }

      // 8. POST /api/auth/sync (User Profile Sync for Sandbox/Demo Logins)
      if (url.pathname === '/api/auth/sync' && req.method === 'POST') {
        const user = (await req.json()) as AuthUser;
        
        if (!user || !user.id || !user.email) {
          return Response.json({ error: 'Valid user profile required' }, { status: 400, headers: securityHeaders });
        }

        upsertUser(user);

        addAuditLog({
          user_id: user.id,
          user_name: user.name,
          action: 'USER_LOGIN',
          details: `User signed in via Sandbox Demo (Role: ${user.role})`,
          timestamp: new Date().toISOString(),
        });

        return Response.json({ success: true, user }, { headers: securityHeaders });
      }

      return new Response('Not Found', { status: 404, headers: securityHeaders });
    } catch (err: any) {
      console.error('API Error:', err);
      return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500, headers: securityHeaders });
    }
  },
});
