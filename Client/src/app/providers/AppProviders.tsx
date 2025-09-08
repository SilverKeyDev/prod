/**
 * App Providers
 * Composes all providers into one root wrapper
 */

import { ReactNode } from "react";
import ErrorProvider from "./ErrorProvider";
import AuthProvider from "./AuthProvider";
import { UserProvider } from "../../context/UserContext";
import { BillingProvider } from "../../context/BillingContext";
import { ReportsProvider } from "../../context/ReportsContext";
import { ChatsProvider } from "../../context/ChatsContext";
import { SavedHomesProvider } from "../../context/SavedHomesContext";
import { AgentProvider } from "../../context/AgentContext";
import { NegotiationProvider } from "../../context/NegotiationContext";
import { DocumentsProvider } from "../../context/DocumentsContext";
import { GoogleMapsProvider } from "../../context/GoogleMapsContext";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorProvider>
      <AuthProvider>
        <GoogleMapsProvider>
          <UserProvider>
            <BillingProvider>
              <ReportsProvider>
                <ChatsProvider>
                  <SavedHomesProvider>
                    <AgentProvider>
                      <NegotiationProvider>
                        <DocumentsProvider>{children}</DocumentsProvider>
                      </NegotiationProvider>
                    </AgentProvider>
                  </SavedHomesProvider>
                </ChatsProvider>
              </ReportsProvider>
            </BillingProvider>
          </UserProvider>
        </GoogleMapsProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}

export default AppProviders;
