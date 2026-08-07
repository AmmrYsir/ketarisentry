import type { ServiceConfig, PollResult, AuditLogEntry, AuthUser } from '../types';

const API_BASE = '/api';

export async function fetchServicesFromApi(): Promise<ServiceConfig[] | null> {
  try {
    const res = await fetch(`${API_BASE}/services`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // API server not running or network issue
  }
  return null;
}

export async function saveServiceToApi(service: ServiceConfig, user?: AuthUser | null): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, user }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteServiceFromApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pollServiceViaApi(config: ServiceConfig): Promise<PollResult | null> {
  try {
    const res = await fetch(`${API_BASE}/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to client side polling
  }
  return null;
}

export async function fetchAuditLogsFromApi(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/audit-logs`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return [];
}

export async function syncUserLoginWithApi(user: AuthUser): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  } catch {
    // Ignore
  }
}
