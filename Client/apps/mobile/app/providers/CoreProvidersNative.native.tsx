import { Fragment, type ReactNode } from "react";

import { View } from "react-native";

import { LocalizationProvider } from "packages/contexts/LocalizationContext";

import { AuthProviderNative } from "./auth/AuthProviderNative.native";
import { ErrorProviderNative } from "./ErrorProviderNative.native";
import { NavigationLinkPrimitiveProvider } from "./NavigationLinkPrimitiveProvider.native";
import { QueryProvider } from "./QueryProvider.native";
import { ThemeProviderNative } from "./theme/ThemeProviderNative.native";

type CoreProvidersNativeProps = {
  children: ReactNode;
  onGoHome?: () => void;
};

/**
 * Native core providers. Order: Error -> Theme -> Auth -> Query -> Localization.
 * onGoHome is passed to ErrorProvider for "Go Home" in error fallback (set when nav is ready).
 * We never pass null/undefined as children to avoid "Cannot read property 'children' of null"
 * in libraries or React when require cycles leave values uninitialized.
 * Every provider is guarded with Fragment so we never render a null component.
 */
export function CoreProvidersNative({ children, onGoHome }: CoreProvidersNativeProps) {
  const safeChildren =
    children != null ? children : <View style={{ flex: 1 }} collapsable={false} />;

  const Localization = typeof LocalizationProvider === "function" ? LocalizationProvider : Fragment;
  const ErrorProvider = typeof ErrorProviderNative === "function" ? ErrorProviderNative : Fragment;
  const ThemeProvider = typeof ThemeProviderNative === "function" ? ThemeProviderNative : Fragment;
  const AuthProvider = typeof AuthProviderNative === "function" ? AuthProviderNative : Fragment;
  const Query = typeof QueryProvider === "function" ? QueryProvider : Fragment;
  const NavLinkProvider =
    typeof NavigationLinkPrimitiveProvider === "function"
      ? NavigationLinkPrimitiveProvider
      : Fragment;

  const content = <Localization>{safeChildren}</Localization>;

  return (
    <ErrorProvider onGoHome={onGoHome}>
      <ThemeProvider>
        <AuthProvider>
          <Query>
            <NavLinkProvider>{content}</NavLinkProvider>
          </Query>
        </AuthProvider>
      </ThemeProvider>
    </ErrorProvider>
  );
}
