import { getAllServices, saveServiceToDb, deleteServiceFromDb, recordPollLog, getAllAuditLogs, addAuditLog, upsertUser } from './db';
import { executePullPoll } from '../src/services/pollingEngine';
import type { ServiceConfig, AuthUser } from '../src/types';

const PORT = process.env.PORT || 3001;

console.log(`🛡️ KetariSentry Bun + SQLite API Server booting on port ${PORT}...`);

Bun.serve({
  port: Number(PORT),
  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers helper
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ketari-Secret',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. GET /api/services
      if (url.pathname === '/api/services' && req.method === 'GET') {
        const services = getAllServices();
        return Response.json(services, { headers: corsHeaders });
      }

      // 2. POST /api/services
      if (url.pathname === '/api/services' && req.method === 'POST') {
        const body = (await req.json()) as { service?: ServiceConfig; user?: AuthUser };
        
        if (!body || !body.service || !body.service.id || !body.service.name || !body.service.url) {
          return Response.json(
            { error: 'Invalid service payload. Mandatory fields: id, name, url.' },
            { status: 400, headers: corsHeaders }
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

        return Response.json({ success: true, service: body.service }, { headers: corsHeaders });
      }

      // 3. DELETE /api/services/:id
      if (url.pathname.startsWith('/api/services/') && req.method === 'DELETE') {
        const id = url.pathname.split('/')[3];
        if (!id) {
          return Response.json({ error: 'Service ID is required' }, { status: 400, headers: corsHeaders });
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

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // 4. POST /api/poll
      if (url.pathname === '/api/poll' && req.method === 'POST') {
        const serviceConfig = (await req.json()) as ServiceConfig;
        
        if (!serviceConfig || !serviceConfig.id || !serviceConfig.url) {
          return Response.json({ error: 'Valid service configuration required' }, { status: 400, headers: corsHeaders });
        }

        const result = await executePullPoll(serviceConfig);

        // Record telemetry log into SQLite
        recordPollLog(result);

        return Response.json(result, { headers: corsHeaders });
      }

      // 5. GET /api/audit-logs
      if (url.pathname === '/api/audit-logs' && req.method === 'GET') {
        const logs = getAllAuditLogs(50);
        return Response.json(logs, { headers: corsHeaders });
      }

      // 6. POST /api/auth/login
      if (url.pathname === '/api/auth/login' && req.method === 'POST') {
        const user = (await req.json()) as AuthUser;
        
        if (!user || !user.id || !user.email) {
          return Response.json({ error: 'Valid user profile required' }, { status: 400, headers: corsHeaders });
        }

        upsertUser(user);

        addAuditLog({
          user_id: user.id,
          user_name: user.name,
          action: 'USER_LOGIN',
          details: `User signed in (Role: ${user.role}, Sandbox: ${user.is_sandbox ? 'Yes' : 'No'})`,
          timestamp: new Date().toISOString(),
        });

        return Response.json({ success: true, user }, { headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err: any) {
      console.error('API Error:', err);
      return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
  },
});
