/**
 * Global type declaration for Google Maps
 */
declare global {
  interface Window {
    google?: typeof google;
  }
}

export {};
