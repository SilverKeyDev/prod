import type { LogCategory } from "./categories";
import type { LogLevel } from "./loggerTypes";
import { createSafeLogObject, maskSensitiveData } from "./pii";

type ProcessingFlag = { value: boolean };

export function formatLogMessage(
  processing: ProcessingFlag,
  level: LogLevel,
  category: LogCategory | string,
  message: string,
  data?: unknown
): string {
  if (processing.value) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${category}] ${message} [RECURSION_PREVENTED]`;
  }

  try {
    processing.value = true;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${category}]`;

    if (data) {
      const scrubbedData = createSafeLogObject(data);
      return `${prefix} ${maskSensitiveData(message)} ${JSON.stringify(scrubbedData)}`;
    }

    return `${prefix} ${maskSensitiveData(message)}`;
  } catch {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${category}] ${message} [FORMAT_ERROR]`;
  } finally {
    processing.value = false;
  }
}
