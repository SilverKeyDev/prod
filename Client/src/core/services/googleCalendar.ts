// Internal API clients
import { googleCalendarApi } from '../config/api';
// Internal utilities
import { getAuthToken } from '../utils/auth';
import { asError } from '../utils/error';
import { isObject, hasProperty } from '../utils/typeGuards';

import { log } from './security/secureLogger';

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
  private callbacks: GoogleCalendarServiceCallbacks = {};
  private localStorageKeys = {
    calendars: 'googleCalendarCalendars',
    events: 'googleCalendarEvents',
    connectionStatus: 'googleCalendarConnected',
  };
  private isFetchingEvents = false; // Prevent concurrent event fetches

  private constructor() {
    this.state = {
      isConnected: this.loadConnectionStatus(),
      calendars: (this.loadFromLocalStorage(this.localStorageKeys.calendars) as unknown[]) || [],
      events: (this.loadFromLocalStorage(this.localStorageKeys.events) as unknown[]) || [],
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
   */
  public setCallbacks(callbacks: GoogleCalendarServiceCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
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
      console.warn(`Failed to load ${key} from localStorage:`, error);
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
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }

  /**
   * Load connection status from cookie and localStorage
   */
  private loadConnectionStatus(): boolean {
    const cookieConnected = document.cookie.includes('google_calendar_connected=true');
    const localStorageConnected = this.loadFromLocalStorage(this.localStorageKeys.connectionStatus) === true;
    return cookieConnected || localStorageConnected;
  }

  /**
   * Update state and notify callbacks
   */
  private updateState(updates: Partial<GoogleCalendarState>): void {
    this.state = { ...this.state, ...updates };
    if (this.callbacks.onStateChange && typeof this.callbacks.onStateChange === 'function') {
      this.callbacks.onStateChange(this.getState());
    }
  }

  /**
   * Start Google OAuth flow
   */
  public startOAuth(): void {
    log.info('GOOGLE_CALENDAR_SERVICE', 'Starting OAuth flow');
    googleCalendarApi.startOAuth();
  }

  /**
   * Check if Google Calendar is connected
   */
  public isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Set connection status
   */
  public setConnectionStatus(connected: boolean): void {
    log.info('GOOGLE_CALENDAR_SERVICE', 'Connection status changed', { connected });
    
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
   * Fetch user's Google calendars
   */
  public async fetchCalendars(): Promise<void> {
    if (!this.state.isConnected) {
      const error = 'Google Calendar not connected';
      this.updateState({ error });
      if (this.callbacks.onError && typeof this.callbacks.onError === 'function') {
        this.callbacks.onError(error);
      }
      return;
    }

    this.updateState({
      isLoading: true,
      error: null,
    });

    try {
      // Get authentication token
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication required. Please log in.');
      }

      log.info('GOOGLE_CALENDAR_SERVICE', 'Fetching calendars');

      const response = await googleCalendarApi.listCalendars();
      
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to fetch calendars');
      }

      const calendars = response.data?.items || [];
      
      this.updateState({
        calendars,
        isLoading: false,
      });

      // Persist to localStorage
      this.saveToLocalStorage(this.localStorageKeys.calendars, calendars);

      // Notify success callback
      if (this.callbacks.onSuccess && typeof this.callbacks.onSuccess === 'function') {
        this.callbacks.onSuccess({ calendars });
      }

      log.info('GOOGLE_CALENDAR_SERVICE', 'Calendars fetched successfully', { count: calendars.length });
    } catch (err: unknown) {
      const error = asError(err);
      log.error('GOOGLE_CALENDAR_SERVICE', 'Error fetching calendars', error);

      let errorMessage = 'Failed to fetch calendars. Please try again.';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request was cancelled or timed out. Please try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (err.message.includes('Authentication required')) {
          errorMessage = 'Please log in again to continue.';
        } else {
          errorMessage = err.message;
        }
      }

      this.updateState({
        error: errorMessage,
        isLoading: false,
      });

      if (this.callbacks.onError && typeof this.callbacks.onError === 'function') {
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
    if (!this.state.isConnected) {
      const error = 'Google Calendar not connected';
      this.updateState({ error });
      if (this.callbacks.onError && typeof this.callbacks.onError === 'function') {
        this.callbacks.onError(error);
      }
      return;
    }

    // Prevent concurrent fetches
    if (this.isFetchingEvents) {
      log.info('GOOGLE_CALENDAR_SERVICE', 'Events fetch already in progress, skipping');
      return;
    }

    this.isFetchingEvents = true;
    this.updateState({
      isLoading: true,
      error: null,
    });

    try {
      // Get authentication token
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication required. Please log in.');
      }

      log.info('GOOGLE_CALENDAR_SERVICE', 'Fetching events', params);

      const response = await googleCalendarApi.listEvents(params);
      
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to fetch events');
      }

      const events = response.data?.items || [];
      
      this.updateState({
        events,
        isLoading: false,
      });

      // Persist to localStorage
      this.saveToLocalStorage(this.localStorageKeys.events, events);

      // Notify success callback
      if (this.callbacks.onSuccess && typeof this.callbacks.onSuccess === 'function') {
        this.callbacks.onSuccess({ events });
      }

      log.info('GOOGLE_CALENDAR_SERVICE', 'Events fetched successfully', { count: events.length });
    } catch (err: unknown) {
      const error = asError(err);
      log.error('GOOGLE_CALENDAR_SERVICE', 'Error fetching events', error);

      let errorMessage = 'Failed to fetch events. Please try again.';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request was cancelled or timed out. Please try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (err.message.includes('Authentication required')) {
          errorMessage = 'Please log in again to continue.';
        } else {
          errorMessage = err.message;
        }
      }

      this.updateState({
        error: errorMessage,
        isLoading: false,
      });

      if (this.callbacks.onError && typeof this.callbacks.onError === 'function') {
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
    if (!this.state.isConnected) {
      const error = 'Google Calendar not connected';
      this.updateState({ error });
      if (this.callbacks.onError && typeof this.callbacks.onError === 'function') {
        this.callbacks.onError(error);
      }
      throw new Error(error);
    }

    try {
      // Get authentication token
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication required. Please log in.');
      }

      log.info('GOOGLE_CALENDAR_SERVICE', 'Creating event', { 
        summary: isObject(event) && hasProperty(event, 'summary') ? event.summary : 'Unknown' 
      });

      const response = await googleCalendarApi.createEvent(event as any);
      
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to create event');
      }

      const createdEvent = response.data;
      
      // Add to local events
      const updatedEvents = [...this.state.events, createdEvent];
      this.updateState({ events: updatedEvents });
      this.saveToLocalStorage(this.localStorageKeys.events, updatedEvents);

      log.info('GOOGLE_CALENDAR_SERVICE', 'Event created successfully', { 
        eventId: isObject(createdEvent) && hasProperty(createdEvent, 'id') ? createdEvent.id : 'Unknown' 
      });

      return createdEvent;
    } catch (err: unknown) {
      const error = asError(err);
      log.error('GOOGLE_CALENDAR_SERVICE', 'Error creating event', error);

      let errorMessage = 'Failed to create event. Please try again.';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request was cancelled or timed out. Please try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (err.message.includes('Authentication required')) {
          errorMessage = 'Please log in again to continue.';
        } else {
          errorMessage = err.message;
        }
      }

      this.updateState({ error: errorMessage });

      if (this.callbacks.onError && typeof this.callbacks.onError === 'function') {
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
      log.info('GOOGLE_CALENDAR_SERVICE', 'Revoking access');

      const response = await googleCalendarApi.revokeAccess();
      
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to revoke access');
      }

      // Clear connection status and data
      this.setConnectionStatus(false);
      googleCalendarApi.clearConnectionStatus();

      log.info('GOOGLE_CALENDAR_SERVICE', 'Access revoked successfully');
    } catch (err: unknown) {
      const error = asError(err);
      log.error('GOOGLE_CALENDAR_SERVICE', 'Error revoking access', error);

      let errorMessage = 'Failed to revoke access. Please try again.';

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      this.updateState({ error: errorMessage });

      if (this.callbacks.onError && typeof this.callbacks.onError === 'function') {
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

    log.info('GOOGLE_CALENDAR_SERVICE', 'All data cleared');
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
