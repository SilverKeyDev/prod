import type { UseMutationOptions } from "@tanstack/react-query";

import { log } from "packages/logger";
import type { UIState } from "packages/store";
import {
  resolveApiResultErrorMessage,
  resolveUserFacingMessage,
} from "packages/utils/core/errorHandling";

/**
 * Shared helpers for DocuSign mutations: logging and standard onSuccess/onError handlers.
 */

export type DocusignApiResponse<T> = {
  success: boolean;
  error?: string;
  [key: string]: unknown;
} & T;

function getErrorMessage(error: Error): string {
  return resolveUserFacingMessage(error, {
    fallbackMessage: "An error occurred while processing your request",
  });
}

/**
 * Run an API call, log debug context, and throw with error log if !response.success.
 * Use in mutationFn to keep each mutation thin.
 */
export async function runDocusignApi<T, R>(
  debugContext: Record<string, unknown>,
  errorLabel: string,
  apiCall: () => Promise<DocusignApiResponse<R>>,
  getData: (response: DocusignApiResponse<R>) => T
): Promise<T> {
  log.debug("DOCUSIGN", errorLabel.replace(" failed", ""), debugContext);
  const response = await apiCall();
  if (!response.success) {
    const errorMessage = resolveApiResultErrorMessage(response, errorLabel);
    log.error("DOCUSIGN", errorLabel, {
      ...debugContext,
      error: errorMessage,
      success: false,
    });
    throw new Error(errorMessage);
  }
  log.debug("DOCUSIGN", `${errorLabel.replace(" failed", "")} completed successfully`, {
    ...debugContext,
    success: true,
  });
  return getData(response);
}

/**
 * Returns onSuccess and onError handlers for DocuSign mutations.
 * Shows success and error toasts to the user.
 */
export function getDocusignMutationHandlers(
  successLabel: string,
  errorLabel: string,
  onSuccessInvalidate: () => void,
  enqueueToast: UIState["enqueueToast"]
): Pick<UseMutationOptions<unknown, Error, unknown>, "onSuccess" | "onError"> {
  return {
    onSuccess: async () => {
      onSuccessInvalidate();
      log.info("DOCUSIGN", successLabel);
      enqueueToast({
        type: "success",
        message: successLabel,
      });
    },
    onError: async (error: Error) => {
      log.error("DOCUSIGN", errorLabel, {
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
  enqueueToast: UIState["enqueueToast"]
): Pick<UseMutationOptions<unknown, Error, TVariables>, "onSuccess" | "onError"> {
  return {
    onSuccess: async (_: unknown, variables: TVariables) => {
      onSuccessInvalidate(variables);
      log.info("DOCUSIGN", successLabel, variables as Record<string, unknown>);
      enqueueToast({
        type: "success",
        message: successLabel,
      });
    },
    onError: async (error: Error, variables: TVariables) => {
      log.error("DOCUSIGN", errorLabel, {
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
