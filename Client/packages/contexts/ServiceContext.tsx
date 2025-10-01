import { createContext, useContext, type ReactNode } from "react";

import { userApi, preferencesApi } from "../config/api";
import { chatService } from "../services/chats";
import { googleMapsService } from "../services/googleMaps";
import { negotiationService } from "../services/negotiation";

/**
 * Service injection context - provides access to services without state management
 * This follows the principle of keeping React Contexts only for non-state concerns
 */
export type ServiceContextType = {
  // API services
  userApi: typeof userApi;
  preferencesApi: typeof preferencesApi;

  // Business logic services
  chatService: typeof chatService;
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
    chatService,
    googleMapsService,
    negotiationService,
  };

  return (
    <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useServices() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
}
