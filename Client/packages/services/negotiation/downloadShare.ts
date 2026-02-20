/**
 * Download, share, and clipboard helpers for negotiation strategy
 */

import { log } from "packages/services/security/secureLogger";
import { asError, isObject } from "packages/utils";
import {
  createBlob,
  createFile,
  getDocument,
  getNavigator,
  getWindow,
} from "packages/utils/core/platform";

function getAddressForFilename(selectedHome: unknown): string {
  if (isObject(selectedHome)) {
    const h = selectedHome as { address?: string };
    if (
      h &&
      typeof h === "object" &&
      "address" in h &&
      typeof h.address === "string"
    ) {
      return h.address;
    }
  }
  if (selectedHome && typeof selectedHome === "string") return selectedHome;
  if (selectedHome) return JSON.stringify(selectedHome);
  return "strategy";
}

export function downloadStrategyJson(
  strategyData: unknown,
  selectedHome: unknown,
): void {
  if (!strategyData) {
    log.warn("NEGOTIATION_SERVICE", "No strategy data to download");
    return;
  }

  try {
    const dataStr = JSON.stringify(strategyData, null, 2);
    const dataBlob = createBlob([dataStr], { type: "application/json" });
    const url =
      typeof URL !== "undefined" && URL.createObjectURL
        ? URL.createObjectURL(dataBlob)
        : null;

    if (!url) throw new Error("URL.createObjectURL is not available");

    const doc = getDocument();
    if (!doc?.body) throw new Error("Document body not available");
    const link = doc.createElement("a");
    link.href = url;
    const address = getAddressForFilename(selectedHome);
    link.download = `negotiation-strategy-${
      typeof address === "string"
        ? address.replace(/[^a-zA-Z0-9]/g, "-")
        : "strategy"
    }.json`;
    doc.body.appendChild(link);
    link.click();
    doc.body.removeChild(link);
    URL.revokeObjectURL(url);

    log.info("NEGOTIATION_SERVICE", "Strategy JSON downloaded successfully");
  } catch (error: unknown) {
    log.error("NEGOTIATION_SERVICE", "Failed to download strategy JSON", error);
  }
}

export async function shareStrategyJson(
  strategyData: unknown,
  selectedHome: unknown,
  copyToClipboard: (text: string) => Promise<void>,
): Promise<void> {
  if (!strategyData) {
    log.warn("NEGOTIATION_SERVICE", "No strategy data to share");
    return;
  }

  try {
    const dataStr = JSON.stringify(strategyData, null, 2);
    const address = getAddressForFilename(selectedHome);

    const nav = getNavigator();
    if (nav?.share && typeof nav.canShare === "function") {
      const shareData = {
        title: "Negotiation Strategy",
        text: `Negotiation strategy for ${address}`,
        files: [
          createFile([dataStr], "negotiation-strategy.json", {
            type: "application/json",
          }),
        ],
      };

      if (nav.canShare(shareData)) {
        try {
          await nav.share(shareData);
          log.info(
            "NEGOTIATION_SERVICE",
            "Strategy shared successfully via Web Share API",
          );
          return;
        } catch (err: unknown) {
          const error = asError(err);
          if (error instanceof Error && error.name !== "AbortError") {
            log.warn(
              "NEGOTIATION_SERVICE",
              "Web Share API failed, trying text share",
              error,
            );
          } else {
            return;
          }
        }
      }
    }

    if (nav?.share && typeof nav.share === "function") {
      try {
        await nav.share({
          title: "Negotiation Strategy",
          text: `Negotiation strategy for ${address}:\n\n${dataStr}`,
        });
        log.info(
          "NEGOTIATION_SERVICE",
          "Strategy shared as text via Web Share API",
        );
        return;
      } catch (err: unknown) {
        const error = asError(err);
        if (error instanceof Error && error.name !== "AbortError") {
          log.warn(
            "NEGOTIATION_SERVICE",
            "Text share also failed, falling back to clipboard",
            error,
          );
        } else {
          return;
        }
      }
    }

    await copyToClipboard(dataStr);
    log.info("NEGOTIATION_SERVICE", "Strategy copied to clipboard as fallback");
  } catch (error: unknown) {
    log.error("NEGOTIATION_SERVICE", "Failed to share strategy", error);
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    const nav = getNavigator();
    const win = getWindow();
    const doc = getDocument();
    if (nav?.clipboard && win?.isSecureContext) {
      await nav.clipboard.writeText(text);
    } else if (doc?.body) {
      const textArea = doc.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      doc.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      doc.execCommand("copy");
      textArea.remove();
    }
  } catch (error: unknown) {
    log.error("NEGOTIATION_SERVICE", "Failed to copy to clipboard", error);
    throw error;
  }
}
