/**
 * Native: we are always inside a React Navigation stack; return true.
 */

export function useInRouterContext(): boolean {
  return true;
}
