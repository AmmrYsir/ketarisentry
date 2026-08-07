import { describe, it, expect } from 'bun:test';
import { 
  getAllServices, 
  saveServiceToDb, 
  deleteServiceFromDb, 
  findUserByEmail, 
  authenticateUserWithPassword, 
  addAuditLog, 
  getAllAuditLogs 
} from '../server/db';
import type { ServiceConfig } from '../src/types';

describe('Ketarisentry Database Unit Tests', () => {
  it('should verify initial seeded superadmin user exists', () => {
    const admin = findUserByEmail('superadmin@ketarisentry.io');
    expect(admin).not.toBeNull();
    expect(admin?.email).toBe('superadmin@ketarisentry.io');
    expect(admin?.role).toBe('superadmin');
  });

  it('should authenticate superadmin with valid password', async () => {
    const user = await authenticateUserWithPassword('superadmin@ketarisentry.io', 'admin');
    expect(user).not.toBeNull();
    expect(user?.email).toBe('superadmin@ketarisentry.io');
  });

  it('should reject authentication with invalid password', async () => {
    const user = await authenticateUserWithPassword('superadmin@ketarisentry.io', 'wrongpassword');
    expect(user).toBeNull();
  });

  it('should save, retrieve, and delete a target health service endpoint', () => {
    const mockService: ServiceConfig = {
      id: `test_srv_${Date.now()}`,
      name: 'Test E-Commerce API',
      url: 'https://api.test.com/ketari/health',
      environment: 'staging',
      poll_interval_sec: 15,
      timeout_sec: 5,
      muted: false,
      enabled: true,
      created_at: new Date().toISOString(),
    };

    saveServiceToDb(mockService);

    const services = getAllServices();
    const found = services.find((s) => s.id === mockService.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Test E-Commerce API');

    deleteServiceFromDb(mockService.id);
    const servicesAfter = getAllServices();
    const deleted = servicesAfter.find((s) => s.id === mockService.id);
    expect(deleted).toBeUndefined();
  });

  it('should log and retrieve audit log events', () => {
    const testAction = `TEST_ACTION_${Date.now()}`;
    addAuditLog({
      user_id: 'usr_test_99',
      user_name: 'Test Auditor',
      action: testAction,
      details: 'Automated Bun unit test audit log entry',
      timestamp: new Date().toISOString(),
    });

    const logs = getAllAuditLogs(50);
    const logEntry = logs.find((l) => l.action === testAction);
    expect(logEntry).toBeDefined();
    expect(logEntry?.user_name).toBe('Test Auditor');
  });
});
