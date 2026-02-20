import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { FreebusyTimeBlock, TimeSlot } from "packages/schemas/scheduling";

export interface SchedulingState {
  // Availability data
  availability: FreebusyTimeBlock[];
  isLoadingAvailability: boolean;
  availabilityError: string | null;

  // Time slots
  availableSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;

  // SilverKey calendar
  silverKeyCalendarId: string | null;
  isLoadingCalendar: boolean;
  calendarError: string | null;

  // Actions
  setAvailability: (availability: FreebusyTimeBlock[]) => void;
  setLoadingAvailability: (loading: boolean) => void;
  setAvailabilityError: (error: string | null) => void;
  setAvailableSlots: (slots: TimeSlot[]) => void;
  setSelectedSlot: (slot: TimeSlot | null) => void;
  setSilverKeyCalendarId: (calendarId: string | null) => void;
  setLoadingCalendar: (loading: boolean) => void;
  setCalendarError: (error: string | null) => void;
  clearSchedulingData: () => void;
}

export const useSchedulingStore = create<SchedulingState>()(
  devtools(
    (set) => ({
      // Initial state
      availability: [],
      isLoadingAvailability: false,
      availabilityError: null,
      availableSlots: [],
      selectedSlot: null,
      silverKeyCalendarId: null,
      isLoadingCalendar: false,
      calendarError: null,

      // Actions
      setAvailability: (availability) => set({ availability }),
      setLoadingAvailability: (loading) =>
        set({ isLoadingAvailability: loading }),
      setAvailabilityError: (error) => set({ availabilityError: error }),
      setAvailableSlots: (slots) => set({ availableSlots: slots }),
      setSelectedSlot: (slot) => set({ selectedSlot: slot }),
      setSilverKeyCalendarId: (calendarId) =>
        set({ silverKeyCalendarId: calendarId }),
      setLoadingCalendar: (loading) => set({ isLoadingCalendar: loading }),
      setCalendarError: (error) => set({ calendarError: error }),
      clearSchedulingData: () =>
        set({
          availability: [],
          isLoadingAvailability: false,
          availabilityError: null,
          availableSlots: [],
          selectedSlot: null,
        }),
    }),
    {
      name: "scheduling-store",
    },
  ),
);
