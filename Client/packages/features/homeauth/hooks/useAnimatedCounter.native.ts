/** Native: show final counter value immediately. */
export function useAnimatedCounter(
  target: number,
  suffix: string,
  _active: boolean,
  _delayMs = 0
): string {
  return `${target}${suffix}`;
}
