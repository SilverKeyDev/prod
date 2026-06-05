import React, { createContext, type ReactNode, useContext } from "react";

import { preferencesApi, userApi } from "packages/config/http/api";
import { negotiationService } from "packages/features/negotiate";
import { googleMapsService } from "packages/features/search";

/**
 * Service injection context - provides access to services without state management
 * This follows the principle of keeping React Contexts only for non-state concerns
 */
export type ServiceContextType = {
  // API services
  userApi: typeof userApi;
  preferencesApi: typeof preferencesApi;

  // Business logic services
  googleMapsService: typeof googleMapsService;
  negotiationService: typeof negotiationService;
};

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export type ServiceProviderProps = {
  children: ReactNode;
};

export function ServiceProvider({ children }: ServiceProviderProps) {
  const value: ServiceContextType = {
    userApi,
    preferencesApi,
    googleMapsService,
    negotiationService,
  };

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useServices() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
}
