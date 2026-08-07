import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ServiceConfig, PollResult, Incident, ServiceWithStatus } from '../types';
import { INITIAL_SERVICES, executePullPoll } from '../services/pollingEngine';
import { fetchServicesFromApi, saveServiceToApi, deleteServiceFromApi, pollServiceViaApi } from '../services/apiClient';

interface HealthContextType {
  services: ServiceConfig[];
  results: Record<string, PollResult>;
  incidents: Incident[];
  isPollingActive: boolean;
  selectedServiceForInspector: ServiceWithStatus | null;
  isAddModalOpen: boolean;
  editingService: ServiceConfig | null;
  togglePolling: () => void;
  triggerPollAll: () => Promise<void>;
  triggerPollSingle: (serviceId: string) => Promise<void>;
  toggleMuteService: (serviceId: string) => void;
  openAddModal: (service?: ServiceConfig) => void;
  closeAddModal: () => void;
  saveService: (config: Omit<ServiceConfig, 'id' | 'created_at'> & { id?: string }) => void;
  deleteService: (serviceId: string) => void;
  openQueueInspector: (serviceWithStatus: ServiceWithStatus) => void;
  closeQueueInspector: () => void;
  exportConfigJson: () => void;
  importConfigJson: (jsonString: string) => boolean;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

const LOCAL_STORAGE_SERVICES_KEY = 'ketarisentry_services';

export const HealthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<ServiceConfig[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SERVICES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return INITIAL_SERVICES;
  });

  const [results, setResults] = useState<Record<string, PollResult>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const [selectedServiceForInspector, setSelectedServiceForInspector] = useState<ServiceWithStatus | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceConfig | null>(null);

  // Sync services from SQLite backend API on mount
  useEffect(() => {
    fetchServicesFromApi().then((apiServices) => {
      if (apiServices && apiServices.length > 0) {
        setServices(apiServices);
        localStorage.setItem(LOCAL_STORAGE_SERVICES_KEY, JSON.stringify(apiServices));
      }
    });
  }, []);

  const saveServicesToStorage = (newServices: ServiceConfig[]) => {
    setServices(newServices);
    localStorage.setItem(LOCAL_STORAGE_SERVICES_KEY, JSON.stringify(newServices));
  };

  const triggerPollSingle = useCallback(async (serviceId: string) => {
    const targetConfig = services.find((s) => s.id === serviceId);
    if (!targetConfig) return;

    // Try polling via SQLite API server first (logs to DB), fallback to client execution
    let res = await pollServiceViaApi(targetConfig);
    if (!res) {
      res = await executePullPoll(targetConfig);
    }

    setResults((prev) => {
      const prevRes = prev[serviceId];
      if (prevRes && prevRes.status !== res!.status) {
        const incident: Incident = {
          id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          service_id: targetConfig.id,
          service_name: targetConfig.name,
          previous_status: prevRes.status,
          new_status: res!.status,
          reason: res!.error_message || `State transitioned to ${res!.status.toUpperCase()}`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setIncidents((incPrev) => [incident, ...incPrev.slice(0, 49)]);
      }
      return { ...prev, [serviceId]: res! };
    });
  }, [services]);

  const triggerPollAll = useCallback(async () => {
    for (const service of services) {
      await triggerPollSingle(service.id);
    }
  }, [services, triggerPollSingle]);

  // Initial poll on mount & polling interval loop
  useEffect(() => {
    triggerPollAll();
  }, [triggerPollAll]);

  useEffect(() => {
    if (!isPollingActive) return;

    const timer = setInterval(() => {
      triggerPollAll();
    }, 15000); // Fleet pulse every 15s

    return () => clearInterval(timer);
  }, [isPollingActive, triggerPollAll]);

  const toggleMuteService = (serviceId: string) => {
    const updated = services.map((s) => {
      if (s.id === serviceId) {
        const newMuted = !s.muted;
        const updatedConfig = { ...s, muted: newMuted };
        saveServiceToApi(updatedConfig);
        return updatedConfig;
      }
      return s;
    });
    saveServicesToStorage(updated);
    triggerPollSingle(serviceId);
  };

  const saveService = (data: Omit<ServiceConfig, 'id' | 'created_at'> & { id?: string }) => {
    let serviceToSave: ServiceConfig;
    if (data.id) {
      serviceToSave = {
        ...data,
        id: data.id,
        created_at: services.find((s) => s.id === data.id)?.created_at || new Date().toISOString(),
      } as ServiceConfig;
      const updated = services.map((s) => (s.id === data.id ? serviceToSave : s));
      saveServicesToStorage(updated);
    } else {
      serviceToSave = {
        ...data,
        id: `srv-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      saveServicesToStorage([...services, serviceToSave]);
    }

    // Persist in SQLite
    saveServiceToApi(serviceToSave);

    setIsAddModalOpen(false);
    setEditingService(null);
    triggerPollAll();
  };

  const deleteService = (serviceId: string) => {
    const updated = services.filter((s) => s.id !== serviceId);
    saveServicesToStorage(updated);
    deleteServiceFromApi(serviceId);

    setResults((prev) => {
      const copy = { ...prev };
      delete copy[serviceId];
      return copy;
    });
  };

  const openAddModal = (service?: ServiceConfig) => {
    setEditingService(service || null);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setEditingService(null);
  };

  const openQueueInspector = (serviceWithStatus: ServiceWithStatus) => {
    setSelectedServiceForInspector(serviceWithStatus);
  };

  const closeQueueInspector = () => {
    setSelectedServiceForInspector(null);
  };

  const exportConfigJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(services, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ketarisentry_fleet_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importConfigJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
        saveServicesToStorage(parsed);
        parsed.forEach((s) => saveServiceToApi(s));
        triggerPollAll();
        return true;
      }
    } catch {
      // Invalid
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
        selectedServiceForInspector,
        isAddModalOpen,
        editingService,
        togglePolling: () => setIsPollingActive((prev) => !prev),
        triggerPollAll,
        triggerPollSingle,
        toggleMuteService,
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

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
