import type { UseMutationOptions } from "@tanstack/react-query";

import type { UIState } from "packages/store";

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
 * Map backend error messages to user-friendly messages
 */
function getErrorMessage(error: Error): string {
  const errorMessage = error.message.toLowerCase();

  // Map backend error types to user-friendly messages
  if (errorMessage.includes("no current revision")) {
    return "Please add a document to the agreement before sending it for signature";
  }
  if (errorMessage.includes("no participants")) {
    return "Please add a recipient to the agreement before sending";
  }
  if (
    errorMessage.includes("invalid state") ||
    errorMessage.includes("cannot be sent")
  ) {
    return "This agreement cannot be sent in its current state";
  }
  if (errorMessage.includes("not found")) {
    return "The agreement could not be found";
  }
  if (
    errorMessage.includes("access denied") ||
    errorMessage.includes("forbidden")
  ) {
    return "You don't have permission to perform this action";
  }
  if (
    errorMessage.includes("authentication") ||
    errorMessage.includes("unauthorized")
  ) {
    return "Please sign in to continue";
  }

  // Default to the error message if we don't have a specific mapping
  return error.message || "An error occurred while processing your request";
}

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
  const { log, LOG_CATEGORIES } = await import("packages/logger");
  log.debug(
    LOG_CATEGORIES.DOCUSIGN,
    errorLabel.replace(" failed", ""),
    debugContext,
  );
  const response = await apiCall();
  if (!response.success) {
    const errorMessage = response.error ?? errorLabel;
    log.error(LOG_CATEGORIES.DOCUSIGN, errorLabel, {
      ...debugContext,
      error: errorMessage,
      success: false,
    });
    throw new Error(errorMessage);
  }
  log.debug(
    LOG_CATEGORIES.DOCUSIGN,
    `${errorLabel.replace(" failed", "")} completed successfully`,
    {
      ...debugContext,
      success: true,
    },
  );
  return getData(response);
}

/**
 * Returns onSuccess and onError handlers for DocuSign mutations.
 * Uses dynamic logger import to avoid circular dependencies.
 * Shows success and error toasts to the user.
 */
export function getDocusignMutationHandlers(
  successLabel: string,
  errorLabel: string,
  onSuccessInvalidate: () => void,
  enqueueToast: UIState["enqueueToast"],
): Pick<UseMutationOptions<unknown, Error, unknown>, "onSuccess" | "onError"> {
  return {
    onSuccess: async () => {
      const { log, LOG_CATEGORIES } = await import("packages/logger");
      onSuccessInvalidate();
      log.info(LOG_CATEGORIES.DOCUSIGN, successLabel);
      enqueueToast({
        type: "success",
        message: successLabel,
      });
    },
    onError: async (error: Error) => {
      const { log, LOG_CATEGORIES } = await import("packages/logger");
      log.error(LOG_CATEGORIES.DOCUSIGN, errorLabel, {
        error: error.message,
        errorName: error.name,
      });
      enqueueToast({
        type: "error",
        message: getErrorMessage(error),
      });
    },
  };
}

/**
 * Like getDocusignMutationHandlers but onSuccess receives mutation variables (e.g. agreementId).
 * Shows success and error toasts to the user.
 */
export function getDocusignMutationHandlersWithVars<TVariables>(
  successLabel: string,
  errorLabel: string,
  onSuccessInvalidate: (variables: TVariables) => void,
  enqueueToast: UIState["enqueueToast"],
): Pick<
  UseMutationOptions<unknown, Error, TVariables>,
  "onSuccess" | "onError"
> {
  return {
    onSuccess: async (_: unknown, variables: TVariables) => {
      const { log, LOG_CATEGORIES } = await import("packages/logger");
      onSuccessInvalidate(variables);
      log.info(
        LOG_CATEGORIES.DOCUSIGN,
        successLabel,
        variables as Record<string, unknown>,
      );
      enqueueToast({
        type: "success",
        message: successLabel,
      });
    },
    onError: async (error: Error, variables: TVariables) => {
      const { log, LOG_CATEGORIES } = await import("packages/logger");
      log.error(LOG_CATEGORIES.DOCUSIGN, errorLabel, {
        error: error.message,
        errorName: error.name,
        variables: variables as Record<string, unknown>,
      });
      enqueueToast({
        type: "error",
        message: getErrorMessage(error),
      });
    },
  };
}
