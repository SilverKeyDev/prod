import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { UserProvider } from './UserContext';
import { BillingProvider } from './BillingContext';
import { ReportsProvider } from './ReportsContext';
import { ChatsProvider } from './ChatsContext';
import { SavedHomesProvider } from './SavedHomesContext';
import { AgentProvider } from './AgentContext';
import { PropertySearchProvider } from './PropertySearchContext';
import { NegotiationProvider } from './NegotiationContext';
import { DocumentsProvider } from './DocumentsContext';
import { GoogleMapsProvider } from './GoogleMapsContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <GoogleMapsProvider>
        <UserProvider>
          <BillingProvider>
            <ReportsProvider>
              <ChatsProvider>
                <SavedHomesProvider>
                  <AgentProvider>
                    <PropertySearchProvider>
                      <NegotiationProvider>
                        <DocumentsProvider>
                            {children}
                        </DocumentsProvider>
                      </NegotiationProvider>
                    </PropertySearchProvider>
                  </AgentProvider>
                </SavedHomesProvider>
              </ChatsProvider>
            </ReportsProvider>
          </BillingProvider>
        </UserProvider>
      </GoogleMapsProvider>
    </AuthProvider>
  );
}
