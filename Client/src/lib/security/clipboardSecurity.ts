/**
 * Clipboard Security Utilities
 * Provides secure clipboard operations and protection for sensitive data
 */

import { log } from './secureLogger';
import { reportSecurityEvent } from './errorReporting';

interface ClipboardOptions {
  timeout?: number; // Auto-clear timeout in ms
  maskValue?: boolean; // Show masked value in UI
  logAccess?: boolean; // Log clipboard access
}

interface SecureClipboardData {
  value: string;
  isSensitive: boolean;
  timestamp: number;
  source: string;
}

class ClipboardSecurity {
  private sensitivePatterns: RegExp[] = [
    // Credit card numbers
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    // SSN patterns
    /\b\d{3}-?\d{2}-?\d{4}\b/g,
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Phone numbers
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    // JWT tokens
    /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
    // API keys (basic pattern)
    /[A-Za-z0-9]{32,}/g,
  ];

  private activeTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Securely copy text to clipboard with protection features
   */
  async copyToClipboard(
    text: string, 
    source: string = 'unknown',
    options: ClipboardOptions = {}
  ): Promise<boolean> {
    const {
      timeout = 30000, // 30 seconds default
      maskValue = true,
      logAccess = true,
    } = options;

    try {
      // Check if text contains sensitive data
      const isSensitive = this.containsSensitiveData(text);
      
      if (isSensitive) {
        log.security('CLIPBOARD', 'Sensitive data copied to clipboard', {
          source,
          dataLength: text.length,
          masked: maskValue ? this.maskSensitiveData(text) : '[REDACTED]',
        });
        
        reportSecurityEvent({
          type: 'data_access',
          severity: 'medium',
          description: 'Sensitive data copied to clipboard',
          metadata: { source, isSensitive: true },
        });
      } else if (logAccess) {
        log.info('CLIPBOARD', 'Data copied to clipboard', {
          source,
          dataLength: text.length,
        });
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(text);

      // Set auto-clear timeout for sensitive data
      if (isSensitive && timeout > 0) {
        this.setAutoClearTimeout(source, timeout);
      }

      return true;
    } catch (error) {
      log.error('CLIPBOARD', 'Failed to copy to clipboard', error);
      return false;
    }
  }

  /**
   * Read from clipboard with security checks
   */
  async readFromClipboard(source: string = 'unknown'): Promise<string | null> {
    try {
      const text = await navigator.clipboard.readText();
      
      const isSensitive = this.containsSensitiveData(text);
      
      if (isSensitive) {
        log.security('CLIPBOARD', 'Sensitive data read from clipboard', {
          source,
          dataLength: text.length,
        });
        
        reportSecurityEvent({
          type: 'data_access',
          severity: 'low',
          description: 'Sensitive data read from clipboard',
          metadata: { source },
        });
      }

      return text;
    } catch (error) {
      log.error('CLIPBOARD', 'Failed to read from clipboard', error);
      return null;
    }
  }

  /**
   * Clear clipboard
   */
  async clearClipboard(source: string = 'auto'): Promise<boolean> {
    try {
      await navigator.clipboard.writeText('');
      
      log.info('CLIPBOARD', 'Clipboard cleared', { source });
      
      return true;
    } catch (error) {
      log.error('CLIPBOARD', 'Failed to clear clipboard', error);
      return false;
    }
  }

  /**
   * Check if text contains sensitive data
   */
  containsSensitiveData(text: string): boolean {
    return this.sensitivePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(text: string): string {
    let masked = text;
    
    this.sensitivePatterns.forEach(pattern => {
      masked = masked.replace(pattern, (match) => {
        if (match.length <= 4) return '***';
        return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
      });
    });
    
    return masked;
  }

  /**
   * Set auto-clear timeout
   */
  private setAutoClearTimeout(source: string, timeout: number): void {
    // Clear existing timeout
    const existingTimeout = this.activeTimeouts.get(source);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      this.clearClipboard('auto-clear');
      this.activeTimeouts.delete(source);
      
      log.info('CLIPBOARD', 'Auto-cleared clipboard', { 
        source, 
        timeoutMs: timeout 
      });
    }, timeout);

    this.activeTimeouts.set(source, timeoutId);
  }

  /**
   * Cancel auto-clear timeout
   */
  cancelAutoClear(source: string): void {
    const timeout = this.activeTimeouts.get(source);
    if (timeout) {
      clearTimeout(timeout);
      this.activeTimeouts.delete(source);
      log.info('CLIPBOARD', 'Auto-clear cancelled', { source });
    }
  }

  /**
   * Get clipboard permissions status
   */
  async getPermissions(): Promise<{
    read: PermissionState;
    write: PermissionState;
  }> {
    try {
      const [readPermission, writePermission] = await Promise.all([
        navigator.permissions.query({ name: 'clipboard-read' as PermissionName }),
        navigator.permissions.query({ name: 'clipboard-write' as PermissionName }),
      ]);

      return {
        read: readPermission.state,
        write: writePermission.state,
      };
    } catch (error) {
      log.error('CLIPBOARD', 'Failed to check permissions', error);
      return {
        read: 'denied',
        write: 'denied',
      };
    }
  }
}

// Export singleton instance
export const clipboardSecurity = new ClipboardSecurity();

// Convenience functions
export const secureClipboardCopy = (text: string, source?: string, options?: ClipboardOptions) =>
  clipboardSecurity.copyToClipboard(text, source, options);

export const secureClipboardRead = (source?: string) =>
  clipboardSecurity.readFromClipboard(source);

export const clearClipboard = (source?: string) =>
  clipboardSecurity.clearClipboard(source);

export const containsSensitiveData = (text: string) =>
  clipboardSecurity.containsSensitiveData(text);

export const maskSensitiveData = (text: string) =>
  clipboardSecurity.maskSensitiveData(text);

export type { ClipboardOptions, SecureClipboardData };
