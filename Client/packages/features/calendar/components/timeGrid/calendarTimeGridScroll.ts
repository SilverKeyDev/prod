import type React from "react";

import ScrollView from "packages/ui/components/primitives/scroll/ScrollView";
import { getWindow } from "packages/utils/platform";

export type CalendarTimeGridScrollViewRef = React.ComponentRef<typeof ScrollView>;

export function setCalendarTimeGridScrollY(
  ref: React.RefObject<CalendarTimeGridScrollViewRef | null>,
  y: number
) {
  const el = ref.current;
  if (!el) return;
  if (getWindow() && el instanceof HTMLElement) {
    el.scrollTop = y;
    return;
  }
  type NativeScroll = { scrollTo: (o: { y: number; animated?: boolean }) => void };
  (el as unknown as NativeScroll).scrollTo({ y, animated: false });
}
