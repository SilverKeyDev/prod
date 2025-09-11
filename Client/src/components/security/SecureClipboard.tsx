/**
 * Secure Clipboard Component
 * Provides protected clipboard operations with user feedback
 */

import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Button from "../ui/button/Button";
import Input from "../ui/form/Input";
import {
  secureClipboardCopy,
  containsSensitiveData,
  maskSensitiveData,
} from "../../lib/security/clipboardSecurity.ts";

interface SecureClipboardProps {
  value: string;
  label?: string;
  className?: string;
  showValue?: boolean;
  autoTimeout?: number;
  source?: string;
  variant?: "button" | "inline" | "field";
}

export const SecureClipboard: React.FC<SecureClipboardProps> = ({
  value,
  label,
  className = "",
  showValue = false,
  autoTimeout = 30000,
  source = "secure-clipboard",
  variant = "button",
}) => {
  const [copied, setCopied] = useState(false);
  const [showSensitive, setShowSensitive] = useState(
    !containsSensitiveData(value),
  );
  const [timeoutRemaining, setTimeoutRemaining] = useState<number | null>(null);

  const isSensitive = containsSensitiveData(value);
  const displayValue = showSensitive ? value : maskSensitiveData(value);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timeoutRemaining && timeoutRemaining > 0) {
      interval = setInterval(() => {
        setTimeoutRemaining((prev) => {
          if (prev && prev <= 1000) {
            setCopied(false);
            return null;
          }
          return prev ? prev - 1000 : null;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeoutRemaining]);

  const handleCopy = async () => {
    const success = await secureClipboardCopy(value, source, {
      timeout: autoTimeout,
      logAccess: true,
    });

    if (success) {
      setCopied(true);
      if (autoTimeout > 0) {
        setTimeoutRemaining(autoTimeout);
      }

      // Reset copied state after 2 seconds
      setTimeout(() => {
        if (!timeoutRemaining) {
          setCopied(false);
        }
      }, 2000);
    }
  };

  const toggleVisibility = () => {
    setShowSensitive(!showSensitive);
  };

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  // Button variant
  if (variant === "button") {
    return (
      <Button
        onClick={handleCopy}
        variant={copied ? "success" : "secondary"}
        size="sm"
        icon={
          copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />
        }
        className={className}
        title={
          isSensitive
            ? "Copy sensitive data (will auto-clear)"
            : "Copy to clipboard"
        }
      >
        {copied ? "Copied" : label || "Copy"}
        {isSensitive && !copied && <Shield className="w-3 h-3 ml-1" />}
        {timeoutRemaining && copied && (
          <span className="ml-2 text-xs opacity-75">
            ({formatTimeRemaining(timeoutRemaining)})
          </span>
        )}
      </Button>
    );
  }

  // Inline variant
  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-gray-600 font-mono">{displayValue}</span>
        {isSensitive && (
          <Button
            variant="ghost"
            size="xs"
            onClick={toggleVisibility}
            icon={
              showSensitive ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )
            }
            className="text-gray-400 hover:text-gray-600"
            title={
              showSensitive ? "Hide sensitive data" : "Show sensitive data"
            }
          />
        )}
        <Button
          variant="ghost"
          size="xs"
          onClick={handleCopy}
          icon={
            copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )
          }
          className="text-gray-400 hover:text-gray-600"
          title="Copy to clipboard"
        />
        {timeoutRemaining && (
          <span className="text-xs text-orange-600 flex items-center bg-orange-50 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeRemaining(timeoutRemaining)}
          </span>
        )}
      </div>
    );
  }

  // Field variant
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {isSensitive && (
            <span className="ml-2 inline-flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Sensitive
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <div className="flex">
          <Input
            value={displayValue}
            readOnly
            className="flex-1 font-mono bg-gray-50 rounded-r-none border-r-0"
          />

          <div className="flex border border-l-0 border-gray-300 rounded-r-lg bg-white">
            {isSensitive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVisibility}
                icon={
                  showSensitive ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )
                }
                className="text-gray-400 hover:text-gray-600 rounded-none border-r border-gray-300"
                title={
                  showSensitive ? "Hide sensitive data" : "Show sensitive data"
                }
              />
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              icon={
                copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )
              }
              className={`
                rounded-l-none
                ${
                  copied
                    ? "text-green-600 bg-green-50"
                    : "text-gray-400 hover:text-gray-600"
                }
              `}
              title="Copy to clipboard"
            />
          </div>
        </div>

        {timeoutRemaining && (
          <div className="absolute -bottom-6 right-0 text-xs text-orange-600 flex items-center bg-orange-50 px-2 py-1 rounded-md">
            <Clock className="w-3 h-3 mr-1" />
            Auto-clear in {formatTimeRemaining(timeoutRemaining)}
          </div>
        )}
      </div>

      {showValue && (
        <p className="text-xs text-gray-500 mt-2">
          Click copy to securely copy to clipboard
          {isSensitive && autoTimeout > 0 && (
            <span className="text-orange-600">
              {" "}
              (will auto-clear in {autoTimeout / 1000}s)
            </span>
          )}
        </p>
      )}
    </div>
  );
};

// Hook for using secure clipboard in components
export const useSecureClipboard = (source: string = "component") => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = async (value: string, options?: { timeout?: number }) => {
    try {
      setError(null);
      const success = await secureClipboardCopy(value, source, options);

      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setError("Failed to copy to clipboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return {
    copy,
    copied,
    error,
    clearError: () => setError(null),
  };
};
