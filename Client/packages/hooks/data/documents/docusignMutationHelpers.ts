import type { UseMutationOptions } from "@tanstack/react-query";

/**
 * Shared helpers for DocuSign mutations: logging (with dynamic import to avoid circular deps)
 * and standard onSuccess/onError handlers.
 */

export type DocusignApiResponse<T> = {
  success: boolean;
  error?: string;
  [key: string]: unknown;
} & T;

/**
 * Run an API call, log debug context, and throw with error log if !response.success.
 * Use in mutationFn to keep each mutation thin.
 */
export async function runDocusignApi<T, R>(
  debugContext: Record<string, unknown>,
  errorLabel: string,
  apiCall: () => Promise<DocusignApiResponse<R>>,
  getData: (response: DocusignApiResponse<R>) => T,
): Promise<T> {
  const { log, LOG_CATEGORIES } = await import("../../../../logger");
  log.debug(
    LOG_CATEGORIES.API,
    errorLabel.replace(" failed", ""),
    debugContext,
  );
  const response = await apiCall();
  if (!response.success) {
    const errorMessage = response.error ?? errorLabel;
    log.error(LOG_CATEGORIES.ERRORS, errorLabel, {
      ...debugContext,
      error: errorMessage,
    });
    throw new Error(errorMessage);
  }
  return getData(response);
}

/**
 * Returns onSuccess and onError handlers for DocuSign mutations.
 * Uses dynamic logger import to avoid circular dependencies.
 */
export function getDocusignMutationHandlers(
  successLabel: string,
  errorLabel: string,
  onSuccessInvalidate: () => void,
): Pick<UseMutationOptions<unknown, Error, unknown>, "onSuccess" | "onError"> {
  return {
    onSuccess: async () => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      onSuccessInvalidate();
      log.debug(LOG_CATEGORIES.API, successLabel);
    },
    onError: async (error: Error) => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      log.error(LOG_CATEGORIES.ERRORS, errorLabel, error);
    },
  };
}

/**
 * Like getDocusignMutationHandlers but onSuccess receives mutation variables (e.g. agreementId).
 */
export function getDocusignMutationHandlersWithVars<TVariables>(
  successLabel: string,
  errorLabel: string,
  onSuccessInvalidate: (variables: TVariables) => void,
): Pick<
  UseMutationOptions<unknown, Error, TVariables>,
  "onSuccess" | "onError"
> {
  return {
    onSuccess: async (_: unknown, variables: TVariables) => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      onSuccessInvalidate(variables);
      log.debug(
        LOG_CATEGORIES.API,
        successLabel,
        variables as Record<string, unknown>,
      );
    },
    onError: async (error: Error) => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      log.error(LOG_CATEGORIES.ERRORS, errorLabel, error);
    },
  };
}
