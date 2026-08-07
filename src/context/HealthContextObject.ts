import { createContext } from 'react';
import type { ServiceConfig, PollResult, IncidentLog, ServiceWithStatus } from '../types';

export interface HealthContextType {
  services: ServiceConfig[];
  results: Record<string, PollResult>;
  incidents: IncidentLog[];
  isPollingActive: boolean;
  isAddModalOpen: boolean;
  editingService: ServiceConfig | null;
  selectedServiceForInspector: ServiceWithStatus | null;
  togglePolling: () => void;
  triggerPollAll: () => Promise<void>;
  triggerPollSingle: (serviceId: string) => Promise<void>;
  toggleMuteService: (serviceId: string) => void;
  toggleEnableService: (serviceId: string) => void;
  openAddModal: (service?: ServiceConfig) => void;
  closeAddModal: () => void;
  saveService: (config: Omit<ServiceConfig, 'id' | 'created_at'> & { id?: string }) => void;
  deleteService: (serviceId: string) => void;
  openQueueInspector: (serviceWithStatus: ServiceWithStatus) => void;
  closeQueueInspector: () => void;
  exportConfigJson: () => void;
  importConfigJson: (jsonString: string) => boolean;
}

export const HealthContext = createContext<HealthContextType | undefined>(undefined);
