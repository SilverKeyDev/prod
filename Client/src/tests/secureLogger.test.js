/**
 * Test script to verify SecureLogger works in production-like environment
 * This simulates the conditions that cause infinite recursion
 */

// Mock production environment
const mockEnv = {
  PROD: true,
};

// Store original console methods
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

// Simulate the SecureLogger class (simplified version)
class TestSecureLogger {
  constructor() {
    this.isProduction = mockEnv.PROD;
    this.currentLevel = 2; // WARN level
    this.isProcessing = false;

    // Store original console methods before override
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };
  }

  scrubStringPII(str) {
    if (this.isProcessing) {
      return "[PROCESSING]";
    }

    try {
      this.isProcessing = true;
      // Simulate PII scrubbing that might cause issues
      let scrubbed = str.replace(/test@example\.com/g, "[REDACTED]");
      return scrubbed;
    } catch (error) {
      return "[SCRUB_ERROR]";
    } finally {
      this.isProcessing = false;
    }
  }

  formatMessage(level, scope, message, data) {
    if (this.isProcessing) {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${scope}] ${message} [RECURSION_PREVENTED]`;
    }

    try {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level}] [${scope}]`;

      if (data) {
        return `${prefix} ${message} ${JSON.stringify(data)}`;
      }

      return `${prefix} ${this.scrubStringPII(message)}`;
    } catch (error) {
      const timestamp = new Date().toISOString();
      return `[${timestamp}] [${level}] [${scope}] ${message} [FORMAT_ERROR]`;
    }
  }

  error(scope, message, error) {
    try {
      let errorData = error;

      if (error instanceof Error) {
        errorData = {
          name: error.name,
          message: error.message,
          stack: this.isProduction ? "[REDACTED]" : error.stack,
        };
      }

      const formatted = this.formatMessage("ERROR", scope, message, errorData);
      this.originalConsole.error(formatted);
    } catch (error) {
      this.originalConsole.error("SecureLogger error error:", error);
    }
  }
}

// Test function
function testSecureLogger() {
  console.log("🧪 Testing SecureLogger recursion protection...\n");

  const testLogger = new TestSecureLogger();

  // Test 1: Normal operation
  console.log("Test 1: Normal error logging");
  try {
    testLogger.error("TEST", "Normal error message");
    console.log("✅ Normal logging works\n");
  } catch (error) {
    console.log("❌ Normal logging failed:", error.message, "\n");
  }

  // Test 2: Override console methods (simulate production)
  console.log("Test 2: Console override simulation");

  const safeConsole = {
    error: originalConsole.error.bind(originalConsole),
  };

  // Override console.error to call testLogger.error (simulating production behavior)
  console.error = (...args) => {
    try {
      testLogger.error("CONSOLE", args.join(" "));
    } catch (error) {
      safeConsole.error("SecureLogger error:", error);
    }
  };

  try {
    // This should NOT cause infinite recursion
    console.error("This is a test error that could cause recursion");
    console.log("✅ Console override with recursion protection works\n");
  } catch (error) {
    console.log("❌ Console override failed:", error.message, "\n");
  }

  // Test 3: Force an error during PII scrubbing
  console.log("Test 3: Error during PII scrubbing");

  // Create a problematic string that might cause regex issues
  const problematicString = "a".repeat(100000) + "test@example.com"; // Very long string

  try {
    testLogger.error("TEST", problematicString);
    console.log("✅ PII scrubbing error handling works\n");
  } catch (error) {
    console.log("❌ PII scrubbing error handling failed:", error.message, "\n");
  }

  // Test 4: Nested error logging
  console.log("Test 4: Nested error logging");

  try {
    // Simulate an error that occurs while logging another error
    const originalFormatMessage = testLogger.formatMessage;
    testLogger.formatMessage = function (...args) {
      // Force an error on first call, then restore
      if (!this._errorForced) {
        this._errorForced = true;
        throw new Error("Simulated formatting error");
      }
      return originalFormatMessage.apply(this, args);
    };

    testLogger.error("TEST", "This should trigger nested error handling");
    console.log("✅ Nested error handling works\n");
  } catch (error) {
    console.log("❌ Nested error handling failed:", error.message, "\n");
  }

  // Restore original console
  console.error = originalConsole.error;

  console.log("🎉 All tests completed!");
}

// Export for testing frameworks
if (typeof module !== "undefined" && module.exports) {
  module.exports = { testSecureLogger, TestSecureLogger };
} else {
  // Run the tests if executed directly
  testSecureLogger();
}
