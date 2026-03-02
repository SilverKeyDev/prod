/**
 * Platform adapter for window/document/navigator/Blob/File so shared packages stay React Native–safe.
 * Apps (e.g. apps/web) set implementations at bootstrap; packages use getters.
 */

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/** Stored references; set by app at bootstrap. */
let platformWindow: Window | null = null;
let platformDocument: Document | null = null;
let platformNavigator: Navigator | null = null;
let platformBlobCtor: ((parts: BlobPart[], options?: BlobPropertyBag) => Blob) | null = null;
let platformFileCtor:
  | ((parts: BlobPart[], name: string, options?: FilePropertyBag) => File)
  | null = null;
let platformFetch: FetchFn | null = null;

export interface PlatformGlobalsConfig {
  window: Window | null;
  document: Document | null;
  navigator: Navigator | null;
  /** Blob constructor (e.g. global Blob). */
  Blob?: (parts: BlobPart[], options?: BlobPropertyBag) => Blob;
  /** File constructor (e.g. global File). */
  File?: (parts: BlobPart[], name: string, options?: FilePropertyBag) => File;
  /** Fetch function (e.g. global fetch). */
  fetch?: FetchFn;
}

/**
 * Set platform globals. Call from app entry (e.g. apps/web) at bootstrap.
 */
export function setPlatformGlobals(config: PlatformGlobalsConfig): void {
  platformWindow = config.window;
  platformDocument = config.document;
  platformNavigator = config.navigator;
  platformBlobCtor = config.Blob ?? null;
  platformFileCtor = config.File ?? null;
  platformFetch = config.fetch ?? null;
}

export function getWindow(): Window | null {
  return platformWindow;
}

export function getDocument(): Document | null {
  return platformDocument;
}

export function getNavigator(): Navigator | null {
  return platformNavigator;
}

/**
 * Get the platform fetch function. Throws if not set.
 */
export function getFetch(): FetchFn {
  if (platformFetch) return platformFetch;
  throw new Error("Platform fetch not set; setPlatformGlobals({ fetch }) in app.");
}

/**
 * Get the platform fetch function if set, or null. Use when calling from error-reporting
 * or other paths that run before bootstrap (avoids unhandled rejection from getFetch()).
 */
export function getFetchIfAvailable(): FetchFn | null {
  return platformFetch;
}

/**
 * Create a Blob using the platform constructor. Throws if not set (e.g. in RN use a polyfill or set from app).
 */
export function createBlob(parts: BlobPart[], options?: BlobPropertyBag): Blob {
  if (platformBlobCtor) return platformBlobCtor(parts, options);
  throw new Error("Platform Blob not set; setPlatformGlobals({ Blob }) in app.");
}

/**
 * Create a File using the platform constructor. Throws if not set.
 */
export function createFile(parts: BlobPart[], name: string, options?: FilePropertyBag): File {
  if (platformFileCtor) return platformFileCtor(parts, name, options);
  throw new Error("Platform File not set; setPlatformGlobals({ File }) in app.");
}
