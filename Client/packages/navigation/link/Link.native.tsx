/**
 * Native: delegates to a link primitive from context (e.g. Pressable) so this
 * package does not import react-native. The app must provide LinkPrimitiveContext.
 */

import { useContext } from "react";

import type { ReactNode } from "react";

import { useNavigation } from "packages/navigation/hooks/useNavigation";
import type { LinkProps as AdapterLinkProps } from "packages/navigation/types";

import { type LinkPrimitive, LinkPrimitiveContext } from "./linkPrimitiveContext";

export type LinkProps = AdapterLinkProps & {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  [key: string]: unknown;
};

export function Link({ to, state, children, onClick, ...rest }: LinkProps): JSX.Element {
  const primitive = useContext(LinkPrimitiveContext) as LinkPrimitive | null;
  const { navigateToPath } = useNavigation();

  const handlePress = () => {
    navigateToPath(to, { state });
    onClick?.();
  };

  if (!primitive) {
    throw new Error(
      "Navigation Link (native) requires LinkPrimitiveContext.Provider. Wrap your app with NavigationLinkPrimitiveProvider from apps/mobile."
    );
  }

  return <>{primitive({ onPress: handlePress, children: children ?? null, ...rest })}</>;
}
