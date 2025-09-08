/**
 * Secure Logger with PII Scrubbing
 * Implements SOC 2 compliant logging that removes sensitive data
 */

interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// PII patterns to scrub from logs
const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone numbers (various formats)
  /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  // SSN patterns
  /\b\d{3}-?\d{2}-?\d{4}\b/g,
  // Credit card numbers (basic pattern)
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // JWT tokens (basic pattern)
  /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
  // API keys (common patterns)
  /[Aa][Pp][Ii][-_]?[Kk][Ee][Yy][-_]?[A-Za-z0-9]{16,}/g,
  // Bearer tokens
  /[Bb]earer\s+[A-Za-z0-9-._~+/]+=*/g,
  // Passwords in URLs or objects
  /password["\s]*[:=]["\s]*[^"\s&]+/gi,
  // Common sensitive field patterns
  /("(?:password|token|key|secret|auth|credential|ssn|social)"\s*:\s*")[^"]*"/gi,
];

// Sensitive keys that should be completely removed from objects
const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'id_token',
  'access_token',
  'refresh_token',
  'authorization',
  'auth',
  'secret',
  'key',
  'apiKey',
  'api_key',
  'credential',
  'credentials',
  'ssn',
  'social_security_number', 'ssn',
  'credit_card', 'creditCard', 'cc',
  'cvv',
  'pin',
];

class SecureLogger {
  private currentLevel: number;
  private isProduction: boolean;
  private isProcessing: boolean = false;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.currentLevel = this.isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
  }

  /**
   * Scrub PII from any value (string, object, array)
   */
  private scrubPII(value: any): any {
    // Prevent infinite recursion during error logging
    if (this.isProcessing) {
      return '[PROCESSING]';
    }

    if (typeof value === 'string') {
      return this.scrubStringPII(value);
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.scrubPII(item));
    }
    
    if (value && typeof value === 'object') {
      return this.scrubObjectPII(value);
    }
    
    return value;
  }

  /**
   * Scrub PII patterns from strings
   */
  private scrubStringPII(str: string): string {
    // Prevent infinite recursion
    if (this.isProcessing) {
      return '[PROCESSING]';
    }

    try {
      this.isProcessing = true;
      let scrubbed = str;
      
      PII_PATTERNS.forEach(pattern => {
        scrubbed = scrubbed.replace(pattern, (match) => {
          // Keep first and last character, mask the middle
          if (match.length <= 4) return '[REDACTED]';
          return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
        });
      });
      
      return scrubbed;
    } catch (error) {
      // Fallback to prevent infinite loops
      return '[SCRUB_ERROR]';
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Scrub sensitive keys from objects
   */
  private scrubObjectPII(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const scrubbed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = this.scrubPII(value);
      }
    }
    
    return scrubbed;
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: string, scope: string, message: string, data?: any): string {
    // Prevent infinite recursion during error logging
    if (this.isProcessing) {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${scope}] ${message} [RECURSION_PREVENTED]`;
    }

    try {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level}] [${scope}]`;
      
      if (data) {
        const scrubbedData = this.scrubPII(data);
        return `${prefix} ${message} ${JSON.stringify(scrubbedData)}`;
      }
      
      return `${prefix} ${this.scrubStringPII(message)}`;
    } catch (error) {
      // Fallback formatting to prevent crashes
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${scope}] ${message} [FORMAT_ERROR]`;
    }
  }

  /**
   * Debug logging (development only)
   */
  debug(scope: string, message: string, data?: any): void {
    if (this.currentLevel <= LOG_LEVELS.DEBUG) {
      const formatted = this.formatMessage('DEBUG', scope, message, data);
      console.debug(formatted);
    }
  }

  /**
   * Info logging
   */
  info(scope: string, message: string, data?: any): void {
    if (this.currentLevel <= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage('INFO', scope, message, data);
      console.info(formatted);
    }
  }

  /**
   * Warning logging
   */
  warn(scope: string, message: string, data?: any): void {
    if (this.currentLevel <= LOG_LEVELS.WARN) {
      const formatted = this.formatMessage('WARN', scope, message, data);
      console.warn(formatted);
    }
  }

  /**
   * Error logging
   */
  error(scope: string, message: string, error?: any): void {
    if (this.currentLevel <= LOG_LEVELS.ERROR) {
      let errorData = error;
      
      // Handle Error objects
      if (error instanceof Error) {
        errorData = {
          name: error.name,
          message: error.message,
          stack: this.isProduction ? '[REDACTED]' : error.stack,
        };
      }
      
      const formatted = this.formatMessage('ERROR', scope, message, errorData);
      console.error(formatted);
    }
  }

  /**
   * Security event logging (always logs)
   */
  security(scope: string, event: string, data?: any): void {
    const scrubbedData = data ? this.scrubPII(data) : undefined;
    const formatted = this.formatMessage('SECURITY', scope, `🔒 ${event}`, scrubbedData);
    console.warn(formatted);
    
    // In production, could send to security monitoring service
    if (this.isProduction) {
      this.sendToSecurityMonitoring(scope, event, scrubbedData);
    }
  }

  /**
   * Send security events to monitoring service (placeholder)
   */
  private sendToSecurityMonitoring(scope: string, event: string, data?: any): void {
    // Placeholder for integration with security monitoring service
    // e.g., Datadog, Splunk, etc.
    try {
      // Example: Send to monitoring endpoint
      // fetch('/api/security-events', {
      //   method: 'POST',
      //   body: JSON.stringify({ scope, event, data, timestamp: new Date().toISOString() })
      // });
      
      // Prevent unused variable warnings
      void scope;
      void event;
      void data;
    } catch (error) {
      // Fail silently to avoid logging loops
    }
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: keyof LogLevel): void {
    this.currentLevel = LOG_LEVELS[level];
  }

  /**
   * Check if level is enabled
   */
  isLevelEnabled(level: keyof LogLevel): boolean {
    return this.currentLevel <= LOG_LEVELS[level];
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();

// Convenience exports
export const log = {
  debug: (scope: string, message: string, data?: any) => secureLogger.debug(scope, message, data),
  info: (scope: string, message: string, data?: any) => secureLogger.info(scope, message, data),
  warn: (scope: string, message: string, data?: any) => secureLogger.warn(scope, message, data),
  error: (scope: string, message: string, error?: any) => secureLogger.error(scope, message, error),
  security: (scope: string, event: string, data?: any) => secureLogger.security(scope, event, data),
};

// Replace console methods in production
if (import.meta.env.PROD) {
  const originalConsole = { ...console };
  
  console.log = (...args) => secureLogger.info('CONSOLE', args.join(' '));
  console.info = (...args) => secureLogger.info('CONSOLE', args.join(' '));
  console.warn = (...args) => secureLogger.warn('CONSOLE', args.join(' '));
  console.error = (...args) => secureLogger.error('CONSOLE', args.join(' '));
  console.debug = (...args) => secureLogger.debug('CONSOLE', args.join(' '));
  
  // Keep original methods available for emergency debugging
  (window as any).__originalConsole = originalConsole;
}
