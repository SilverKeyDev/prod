/**
 * Native: route params from React Navigation.
 */

import { useRoute } from "@react-navigation/native";

export function useRouteParams<T extends Partial<Record<string, string | undefined>>>(): T {
  const route = useRoute();
  const p = route.params;
  if (p && typeof p === "object") {
    return p as T;
  }
  return {} as T;
}
