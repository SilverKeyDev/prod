// Internal API clients
import { googleCalendarApi } from "../config/api";
import { authApi } from "../config/api/auth";
// Internal utilities
import { asError } from "../utils/error";
import { isObject, hasProperty } from "../utils/typeGuards";
import { log, LOG_CATEGORIES } from "../../logger";

// Internal services

/**
 * Types for Google Calendar service
 */
export type GoogleCalendarState = {
  isConnected: boolean;
  calendars: unknown[];
  events: unknown[];
  isLoading: boolean;
  error: string | null;
};

export type GoogleCalendarServiceCallbacks = {
  onStateChange?: (state: GoogleCalendarState) => void;
  onError?: (error: string) => void;
  onSuccess?: (data: { calendars?: unknown[]; events?: unknown[] }) => void;
};

/**
 * Google Calendar service for managing Google Calendar integration, OAuth, and data persistence
 */
export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private state: GoogleCalendarState;
  private callbacks: GoogleCalendarServiceCallbacks[] = []; // Array to support multiple callbacks
  private localStorageKeys = {
    calendars: "googleCalendarCalendars",
    events: "googleCalendarEvents",
    connectionStatus: "googleCalendarConnected",
  };
  private isFetchingEvents = false; // Prevent concurrent event fetches
  private isCheckingConnection = false; // Prevent concurrent connection checks

  private constructor() {
    this.state = {
      isConnected: this.loadConnectionStatus(),
      calendars:
        (this.loadFromLocalStorage(
          this.localStorageKeys.calendars,
        ) as unknown[]) || [],
      events:
        (this.loadFromLocalStorage(
          this.localStorageKeys.events,
        ) as unknown[]) || [],
      isLoading: false,
      error: null,
    };
  }

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  /**
   * Set callbacks for state changes
   * Supports multiple callbacks by maintaining an array
   */
  public setCallbacks(callbacks: GoogleCalendarServiceCallbacks): void {
    // Remove existing callbacks with same reference if re-registering
    // Otherwise add to array to support multiple components
    const existingIndex = this.callbacks.findIndex(
      (cb) => cb === callbacks
    );
    if (existingIndex >= 0) {
      this.callbacks[existingIndex] = callbacks;
    } else {
      this.callbacks.push(callbacks);
    }
  }

  /**
   * Remove callbacks
   */
  public removeCallbacks(callbacks: GoogleCalendarServiceCallbacks): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callbacks);
  }

  /**
   * Get current state
   */
  public getState(): GoogleCalendarState {
    return { ...this.state };
  }

  /**
   * Load data from localStorage
   */
  private loadFromLocalStorage(key: string): unknown {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error: unknown) {
      log.warn(LOG_CATEGORIES.API, `Failed to load ${key} from localStorage`, error);
      return null;
    }
  }

  /**
   * Save data to localStorage
   */
  private saveToLocalStorage(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error: unknown) {
      log.warn(LOG_CATEGORIES.API, `Failed to save ${key} to localStorage`, error);
    }
  }

  /**
   * Load connection status from cookie and localStorage
   */
  private loadConnectionStatus(): boolean {
    const cookieConnected = document.cookie.includes(
      "google_calendar_connected=true",
    );
    const localStorageConnected =
      this.loadFromLocalStorage(this.localStorageKeys.connectionStatus) ===
      true;
    return cookieConnected || localStorageConnected;
  }

  /**
   * Update state and notify all callbacks
   */
  private updateState(updates: Partial<GoogleCalendarState>): void {
    this.state = { ...this.state, ...updates };
    // Notify all registered callbacks
    this.callbacks.forEach((callback) => {
      if (
        callback.onStateChange &&
        typeof callback.onStateChange === "function"
      ) {
        try {
          callback.onStateChange(this.getState());
        } catch (error) {
          log.error(LOG_CATEGORIES.ERRORS, "Error in Google Calendar callback", error);
        }
      }
    });
  }

  /**
   * Start Google OAuth flow
   */
  public startOAuth(): void {
      log.info(LOG_CATEGORIES.API, "Starting OAuth flow");
    googleCalendarApi.startOAuth();
  }

  /**
   * Check if Google Calendar is connected
   * Verifies with backend to ensure accuracy
   */
  public async isConnected(): Promise<boolean> {
    // If already checking, return current state
    if (this.isCheckingConnection) {
      return this.state.isConnected;
    }

    // Check backend for actual connection status
    try {
      this.isCheckingConnection = true;
      const backendConnected = await googleCalendarApi.isConnected();
        
      // Update state if different
      if (backendConnected !== this.state.isConnected) {
        this.setConnectionStatus(backendConnected);
      }
        
      return backendConnected;
    } catch (error) {
      log.warn(LOG_CATEGORIES.API, "Failed to check connection status with backend", error);
      // Fall back to local state
    } finally {
      this.isCheckingConnection = false;
    }

    return this.state.isConnected;
  }

  /**
   * Set connection status
   */
  public setConnectionStatus(connected: boolean): void {
      log.info(LOG_CATEGORIES.API, "Connection status changed", {
      connected,
    });

    this.updateState({ isConnected: connected });
    this.saveToLocalStorage(this.localStorageKeys.connectionStatus, connected);

    if (!connected) {
      // Clear data when disconnected
      this.updateState({
        calendars: [],
        events: [],
        error: null,
      });
      this.saveToLocalStorage(this.localStorageKeys.calendars, []);
      this.saveToLocalStorage(this.localStorageKeys.events, []);
    }
  }

  /**
   * Set calendars directly (used for syncing with React Query cache)
   */
  public setCalendars(calendars: unknown[]): void {
    log.info(LOG_CATEGORIES.API, "Calendars updated", {
      count: calendars.length,
    });

    this.updateState({ calendars });
    this.saveToLocalStorage(this.localStorageKeys.calendars, calendars);

    // Notify all success callbacks
    this.callbacks.forEach((callback) => {
      if (callback.onSuccess && typeof callback.onSuccess === "function") {
        try {
          callback.onSuccess({ calendars });
        } catch (error) {
          log.error(LOG_CATEGORIES.ERRORS, "Error in Google Calendar success callback", error);
        }
      }
    });
  }

  /**
   * Fetch user's Google calendars
   */
  public async fetchCalendars(): Promise<void> {
    // Verify connection status with backend
    const connected = await this.isConnected();
    if (!connected) {
      const error = "Google Calendar not connected";
      this.updateState({ error });
      // Notify all error callbacks
      this.callbacks.forEach((callback) => {
        if (callback.onError && typeof callback.onError === "function") {
          try {
            callback.onError(error);
          } catch (err) {
            log.error(LOG_CATEGORIES.ERRORS, "Error in Google Calendar error callback", err);
          }
        }
      });
      return;
    }

    this.updateState({
      isLoading: true,
      error: null,
    });

    try {
      // Check authentication status using auth API
      const authCheck = await authApi.verifySession();
      if (!authCheck.success) {
        throw new Error("Authentication required. Please log in.");
      }

      log.info(LOG_CATEGORIES.API, "Fetching calendars");

      const response = await googleCalendarApi.listCalendars();

      if (!response.success) {
        const errorMsg = response.error ?? "Failed to fetch calendars";
        
        // Check if this is a Google Calendar connection error
        if (
          errorMsg.includes("Google Calendar not connected") ||
          errorMsg.includes("401") ||
          errorMsg.includes("UNAUTHORIZED")
        ) {
          log.warn(
            "GOOGLE_CALENDAR_SERVICE",
            "Google Calendar connection error detected - resetting connection status and triggering OAuth",
          );
          this.setConnectionStatus(false);
          
          // Automatically trigger OAuth flow instead of throwing error
          log.info(
            LOG_CATEGORIES.API,
            "Automatically starting OAuth flow for reconnection",
          );
          this.startOAuth();
          
          // Return early - don't throw error since we're redirecting
          return;
        }
        
        throw new Error(errorMsg);
      }

      const calendars = response.data?.items || [];

      this.updateState({
        calendars,
        isLoading: false,
      });

      // Persist to localStorage
      this.saveToLocalStorage(this.localStorageKeys.calendars, calendars);

      // Notify all success callbacks
      this.callbacks.forEach((callback) => {
        if (callback.onSuccess && typeof callback.onSuccess === "function") {
          try {
            callback.onSuccess({ calendars });
          } catch (error) {
            log.error(LOG_CATEGORIES.ERRORS, "Error in Google Calendar success callback", error);
          }
        }
      });

      log.info(LOG_CATEGORIES.API, "Calendars fetched successfully", {
        count: calendars.length,
      });
    } catch (err: unknown) {
      const error = asError(err);
      log.error(LOG_CATEGORIES.ERRORS, "Error fetching calendars", error);

      let errorMessage = "Failed to fetch calendars. Please try again.";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage =
            "Request was cancelled or timed out. Please try again.";
        } else if (err.message.includes("timeout")) {
          errorMessage =
            "Request timed out. Please check your connection and try again.";
        } else if (err.message.includes("Authentication required")) {
          errorMessage = "Please log in again to continue.";
        } else {
          errorMessage = err.message;
        }
      }

      // Check if this is a 401 error or Google Calendar not connected - reset connection status
      const errorString =
        err instanceof Error ? err.message : String(err ?? "");
      const isUnauthorized =
        errorString.includes("401") ||
        errorString.includes("UNAUTHORIZED") ||
        errorString.includes("Google Calendar not connected");

      if (isUnauthorized) {
        log.warn(
          LOG_CATEGORIES.API,
          "Google Calendar connection error detected - resetting connection status and triggering OAuth",
        );
        this.setConnectionStatus(false);
        
        // Automatically trigger OAuth flow instead of showing error
        // This provides a seamless reconnection experience
        log.info(
          "GOOGLE_CALENDAR_SERVICE",
          "Automatically starting OAuth flow for reconnection",
        );
        this.startOAuth();
        
        // Don't set error message or call onError callback since we're redirecting
        // The user will be redirected to Google OAuth and then back to the app
        return;
      }

      this.updateState({
        error: errorMessage,
        isLoading: false,
      });

      if (
        this.callbacks.onError &&
        typeof this.callbacks.onError === "function"
      ) {
        this.callbacks.onError(errorMessage);
      }
    }
  }

  /**
   * Fetch events from a calendar
   */
  public async fetchEvents(params?: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
  }): Promise<void> {
    // Prevent concurrent fetches
    if (this.isFetchingEvents) {
      log.info(
        LOG_CATEGORIES.API,
        "Events fetch already in progress, skipping",
      );
      return;
    }

    // Verify connection status with backend
    const connected = await this.isConnected();
    if (!connected) {
      const error = "Google Calendar not connected";
      this.updateState({ error });
      // Notify all error callbacks
      this.callbacks.forEach((callback) => {
        if (callback.onError && typeof callback.onError === "function") {
          try {
            callback.onError(error);
          } catch (err) {
            log.error(LOG_CATEGORIES.ERRORS, "Error in Google Calendar error callback", err);
          }
        }
      });
      return;
    }

    this.isFetchingEvents = true;
    this.updateState({
      isLoading: true,
      error: null,
    });

    try {
      // Check authentication status using auth API
      const authCheck = await authApi.verifySession();
      if (!authCheck.success) {
        throw new Error("Authentication required. Please log in.");
      }

      log.info(LOG_CATEGORIES.API, "Fetching events", params);

      const response = await googleCalendarApi.listEvents(params);

      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch events");
      }

      const events = response.data?.items || [];

      this.updateState({
        events,
        isLoading: false,
      });

      // Persist to localStorage
      this.saveToLocalStorage(this.localStorageKeys.events, events);

      // Notify success callback
      if (
        this.callbacks.onSuccess &&
        typeof this.callbacks.onSuccess === "function"
      ) {
        this.callbacks.onSuccess({ events });
      }

      log.info(LOG_CATEGORIES.API, "Events fetched successfully", {
        count: events.length,
      });
    } catch (err: unknown) {
      const error = asError(err);
      log.error(LOG_CATEGORIES.ERRORS, "Error fetching events", error);

      let errorMessage = "Failed to fetch events. Please try again.";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage =
            "Request was cancelled or timed out. Please try again.";
        } else if (err.message.includes("timeout")) {
          errorMessage =
            "Request timed out. Please check your connection and try again.";
        } else if (err.message.includes("Authentication required")) {
          errorMessage = "Please log in again to continue.";
        } else {
          errorMessage = err.message;
        }
      }

      // Check if this is a 401 error or Google Calendar not connected - reset connection status
      const errorString =
        err instanceof Error ? err.message : String(err ?? "");
      const isUnauthorized =
        errorString.includes("401") ||
        errorString.includes("UNAUTHORIZED") ||
        errorString.includes("Google Calendar not connected");

      if (isUnauthorized) {
        log.warn(
          LOG_CATEGORIES.API,
          "Google Calendar connection error detected - resetting connection status and triggering OAuth",
        );
        this.setConnectionStatus(false);
        
        // Automatically trigger OAuth flow instead of showing error
        // This provides a seamless reconnection experience
        log.info(
          "GOOGLE_CALENDAR_SERVICE",
          "Automatically starting OAuth flow for reconnection",
        );
        this.startOAuth();
        
        // Don't set error message or call onError callback since we're redirecting
        // The user will be redirected to Google OAuth and then back to the app
        this.isFetchingEvents = false;
        return;
      }

      this.updateState({
        error: errorMessage,
        isLoading: false,
      });

      if (
        this.callbacks.onError &&
        typeof this.callbacks.onError === "function"
      ) {
        this.callbacks.onError(errorMessage);
      }
    } finally {
      this.isFetchingEvents = false;
    }
  }

  /**
   * Create a new event
   */
  public async createEvent(event: unknown): Promise<unknown> {
    // Verify connection status with backend
    const connected = await this.isConnected();
    if (!connected) {
      const error = "Google Calendar not connected";
      this.updateState({ error });
      // Notify all error callbacks
      this.callbacks.forEach((callback) => {
        if (callback.onError && typeof callback.onError === "function") {
          try {
            callback.onError(error);
          } catch (err) {
            log.error(LOG_CATEGORIES.ERRORS, "Error in Google Calendar error callback", err);
          }
        }
      });
      throw new Error(error);
    }

    try {
      // Check authentication status using auth API
      const authCheck = await authApi.verifySession();
      if (!authCheck.success) {
        throw new Error("Authentication required. Please log in.");
      }

      log.info(LOG_CATEGORIES.API, "Creating event", {
        summary:
          isObject(event) && hasProperty(event, "summary")
            ? event.summary
            : "Unknown",
      });

      const response = await googleCalendarApi.createEvent(
        event as import("../config/api/googleCalendar").GoogleEvent,
      );

      if (!response.success) {
        throw new Error(response.error ?? "Failed to create event");
      }

      const createdEvent = response.data;

      // Add to local events
      const updatedEvents = [...this.state.events, createdEvent];
      this.updateState({ events: updatedEvents });
      this.saveToLocalStorage(this.localStorageKeys.events, updatedEvents);

      log.info(LOG_CATEGORIES.API, "Event created successfully", {
        eventId:
          isObject(createdEvent) && hasProperty(createdEvent, "id")
            ? createdEvent.id
            : "Unknown",
      });

      return createdEvent;
    } catch (err: unknown) {
      const error = asError(err);
      log.error(LOG_CATEGORIES.ERRORS, "Error creating event", error);

      let errorMessage = "Failed to create event. Please try again.";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage =
            "Request was cancelled or timed out. Please try again.";
        } else if (err.message.includes("timeout")) {
          errorMessage =
            "Request timed out. Please check your connection and try again.";
        } else if (err.message.includes("Authentication required")) {
          errorMessage = "Please log in again to continue.";
        } else {
          errorMessage = err.message;
        }
      }

      this.updateState({ error: errorMessage });

      if (
        this.callbacks.onError &&
        typeof this.callbacks.onError === "function"
      ) {
        this.callbacks.onError(errorMessage);
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Revoke Google Calendar access
   */
  public async revokeAccess(): Promise<void> {
    try {
      log.info(LOG_CATEGORIES.API, "Revoking access");

      const response = await googleCalendarApi.revokeAccess();

      if (!response.success) {
        throw new Error(response.error ?? "Failed to revoke access");
      }

      // Clear connection status and data
      this.setConnectionStatus(false);
      googleCalendarApi.clearConnectionStatus();

      log.info(LOG_CATEGORIES.API, "Access revoked successfully");
    } catch (err: unknown) {
      const error = asError(err);
      log.error(LOG_CATEGORIES.ERRORS, "Error revoking access", error);

      let errorMessage = "Failed to revoke access. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      this.updateState({ error: errorMessage });

      if (
        this.callbacks.onError &&
        typeof this.callbacks.onError === "function"
      ) {
        this.callbacks.onError(errorMessage);
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Clear all data
   */
  public clearData(): void {
    this.updateState({
      calendars: [],
      events: [],
      error: null,
    });

    // Clear localStorage
    Object.values(this.localStorageKeys).forEach((key) => {
      localStorage.removeItem(key);
    });

    log.info(LOG_CATEGORIES.API, "All data cleared");
  }

  /**
   * Reset service state (useful for testing or cleanup)
   */
  public reset(): void {
    this.state = {
      isConnected: false,
      calendars: [],
      events: [],
      isLoading: false,
      error: null,
    };
    this.callbacks = {};
  }
}

// Export singleton instance
export const googleCalendarService = GoogleCalendarService.getInstance();
