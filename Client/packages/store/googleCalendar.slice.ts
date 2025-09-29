import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface GoogleCalendarState {
  // Connection status
  isConnected: boolean;

  // Calendars data
  calendars: unknown[];
  calendarsLoading: boolean;
  calendarsError: string | null;

  // Events data
  events: unknown[];
  eventsLoading: boolean;
  eventsError: string | null;

  // Actions
  setIsConnected: (connected: boolean) => void;
  setCalendars: (calendars: unknown[]) => void;
  setCalendarsLoading: (loading: boolean) => void;
  setCalendarsError: (error: string | null) => void;
  setEvents: (events: unknown[]) => void;
  setEventsLoading: (loading: boolean) => void;
  setEventsError: (error: string | null) => void;
  clearData: () => void;
}

export const useGoogleCalendarStore = create<GoogleCalendarState>()(
  devtools(
    (set) => ({
      // Initial state
      isConnected: false,
      calendars: [],
      calendarsLoading: false,
      calendarsError: null,
      events: [],
      eventsLoading: false,
      eventsError: null,

      // Actions
      setIsConnected: (connected) => set({ isConnected: connected }),
      setCalendars: (calendars) => set({ calendars }),
      setCalendarsLoading: (loading) => set({ calendarsLoading: loading }),
      setCalendarsError: (error) => set({ calendarsError: error }),
      setEvents: (events) => set({ events }),
      setEventsLoading: (loading) => set({ eventsLoading: loading }),
      setEventsError: (error) => set({ eventsError: error }),
      clearData: () =>
        set({
          calendars: [],
          calendarsLoading: false,
          calendarsError: null,
          events: [],
          eventsLoading: false,
          eventsError: null,
        }),
    }),
    {
      name: "google-calendar-store",
    },
  ),
);
