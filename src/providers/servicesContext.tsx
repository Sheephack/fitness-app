import { createContext, useContext } from 'react';
import type { FitnessService } from '@/application/FitnessService';

export interface ServicesContextValue {
  service: FitnessService;
  previewMode: boolean;
}

export const ServicesContext = createContext<ServicesContextValue | null>(null);

export function useFitnessService(): ServicesContextValue {
  const value = useContext(ServicesContext);
  if (!value) throw new Error('Fitness services are not available');
  return value;
}
