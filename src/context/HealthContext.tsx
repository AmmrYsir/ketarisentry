import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ServiceConfig, PollResult, Incident, ServiceWithStatus } from '../types';
import { INITIAL_SERVICES } from '../services/pollingEngine';
import { 
  fetchServicesFromApi, 
  saveServiceToApi, 
  deleteServiceFromApi, 
  pollServiceViaApi 
} from '../services/apiClient';
import { executePullPoll } from '../services/pollingEngine';
import { HealthContext } from './HealthContextObject';

const LOCAL_STORAGE_SERVICES_KEY = 'ketarisentry_services';

function playOutageAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio context not allowed or unsupported
  }
}

export const HealthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<ServiceConfig[]>(() => {
    const localSaved = localStorage.getItem(LOCAL_STORAGE_SERVICES_KEY);
    if (localSaved) {
      try {
        return JSON.parse(localSaved);
      } catch {
        // Fallback
      }
    }
    return INITIAL_SERVICES;
  });

  const [results, setResults] = useState<Record<string, PollResult>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceConfig | null>(null);
  const [selectedServiceForInspector, setSelectedServiceForInspector] = useState<ServiceWithStatus | null>(null);

  // Sync services from backend SQLite API on load
  useEffect(() => {
    let isMounted = true;
    fetchServicesFromApi().then((apiServices) => {
      if (isMounted && apiServices && apiServices.length > 0) {
        setServices(apiServices);
        localStorage.setItem(LOCAL_STORAGE_SERVICES_KEY, JSON.stringify(apiServices));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const saveServicesToStateAndLocal = useCallback((updated: ServiceConfig[]) => {
    setServices(updated);
    localStorage.setItem(LOCAL_STORAGE_SERVICES_KEY, JSON.stringify(updated));
  }, []);

  const pollSingle = useCallback(async (service: ServiceConfig) => {
    if (service.muted || service.enabled === false) return;

    let res = await pollServiceViaApi(service);
    if (!res) {
      res = await executePullPoll(service);
    }

    setResults((prev) => {
      const prevResult = prev[service.id];
      const prevHistory = prevResult?.latency_history || [25, 30, 28, 35, 40];
      const newHistory = [...prevHistory.slice(-9), res.latency_ms];

      const previousStatus = prevResult?.status || 'operational';
      const newStatus = res.status;

      if (previousStatus !== newStatus) {
        const newIncident: Incident = {
          id: `inc_${Date.now()}`,
          service_id: service.id,
          service_name: service.name,
          previous_status: previousStatus,
          new_status: newStatus,
          reason: res.error_message || `Service status changed from ${previousStatus} to ${newStatus}`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setIncidents((prevInc) => [newIncident, ...prevInc.slice(0, 19)]);

        // Sound & Browser Alert for Outage
        if (newStatus === 'outage') {
          playOutageAlertSound();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🚨 KETARISENTRY OUTAGE ALERT: ${service.name}`, {
              body: res.error_message || `Endpoint ${service.url} entered Outage state!`,
              icon: '/favicon.ico',
            });
          }
        }
      }

      return {
        ...prev,
        [service.id]: {
          ...res,
          latency_history: newHistory,
        },
      };
    });
  }, []);

  const pollAll = useCallback(async () => {
    const activeServices = services.filter((s) => !s.muted && s.enabled !== false);
    await Promise.all(activeServices.map((s) => pollSingle(s)));
  }, [services, pollSingle]);

  // Polling interval timer
  const pollAllRef = useRef(pollAll);
  pollAllRef.current = pollAll;

  useEffect(() => {
    if (!isPollingActive) return;

    pollAllRef.current();

    const interval = setInterval(() => {
      pollAllRef.current();
    }, 15000);

    return () => clearInterval(interval);
  }, [isPollingActive]);

  const togglePolling = () => setIsPollingActive((prev) => !prev);
  const triggerPollAll = async () => {
    await pollAll();
  };

  const triggerPollSingle = async (serviceId: string) => {
    const s = services.find((srv) => srv.id === serviceId);
    if (s) {
      await pollSingle(s);
    }
  };

  const toggleMuteService = (serviceId: string) => {
    const updated = services.map((s) => (s.id === serviceId ? { ...s, muted: !s.muted } : s));
    saveServicesToStateAndLocal(updated);
    const target = updated.find((s) => s.id === serviceId);
    if (target) {
      saveServiceToApi(target);
    }
  };

  const toggleEnableService = (serviceId: string) => {
    const updated = services.map((s) => (s.id === serviceId ? { ...s, enabled: s.enabled === false ? true : false } : s));
    saveServicesToStateAndLocal(updated);
    const target = updated.find((s) => s.id === serviceId);
    if (target) {
      saveServiceToApi(target);
    }
  };

  const openAddModal = (service?: ServiceConfig) => {
    setEditingService(service || null);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setEditingService(null);
    setIsAddModalOpen(false);
  };

  const saveService = (config: Omit<ServiceConfig, 'id' | 'created_at'> & { id?: string }) => {
    let updated: ServiceConfig[];
    let target: ServiceConfig;

    if (config.id) {
      updated = services.map((s) => (s.id === config.id ? ({ ...s, ...config } as ServiceConfig) : s));
      target = updated.find((s) => s.id === config.id)!;
    } else {
      const newService: ServiceConfig = {
        ...config,
        id: `srv_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      updated = [...services, newService];
      target = newService;
    }

    saveServicesToStateAndLocal(updated);
    saveServiceToApi(target);
    closeAddModal();
  };

  const deleteService = (serviceId: string) => {
    const updated = services.filter((s) => s.id !== serviceId);
    saveServicesToStateAndLocal(updated);
    deleteServiceFromApi(serviceId);
    setResults((prev) => {
      const copy = { ...prev };
      delete copy[serviceId];
      return copy;
    });
  };

  const openQueueInspector = (serviceWithStatus: ServiceWithStatus) => {
    setSelectedServiceForInspector(serviceWithStatus);
  };

  const closeQueueInspector = () => {
    setSelectedServiceForInspector(null);
  };

  const exportConfigJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(services, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ketarisentry_fleet_config_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importConfigJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        saveServicesToStateAndLocal(parsed);
        parsed.forEach((s) => saveServiceToApi(s));
        return true;
      }
    } catch {
      // Invalid JSON
    }
    return false;
  };

  return (
    <HealthContext.Provider
      value={{
        services,
        results,
        incidents,
        isPollingActive,
        isAddModalOpen,
        editingService,
        selectedServiceForInspector,
        togglePolling,
        triggerPollAll,
        triggerPollSingle,
        toggleMuteService,
        toggleEnableService,
        openAddModal,
        closeAddModal,
        saveService,
        deleteService,
        openQueueInspector,
        closeQueueInspector,
        exportConfigJson,
        importConfigJson,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};
