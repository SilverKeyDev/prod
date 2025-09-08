/* =========================
   Logging Utilities
   ========================= */

import { log } from '../../lib/security/secureLogger';

/**
 * Logs API request details with minimal information
 */
export function logApiRequest(method: string, url: string) {
  // Only log basic request info - method and URL
  log.info('API_REQUEST', `${method} ${url.replace(/\/\d+/g, '/:id')}`);
}

/**
 * Logs API response details with minimal information
 */
export function logApiResponse(method: string, url: string, status: number, duration?: number) {
  // Only log basic response info - method, URL, status, and duration
  const durationText = duration ? ` (${duration}ms)` : '';
  log.info('API_RESPONSE', `${method} ${url.replace(/\/\d+/g, '/:id')} - ${status}${durationText}`);
}
