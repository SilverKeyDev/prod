/**
 * Download, share, and clipboard helpers for negotiation strategy
 */

import { log } from "packages/logger";
import { secureClipboardCopy } from "packages/services/security/clipboardSecurity";
import { isObject } from "packages/utils";
import { tryWebShare } from "packages/utils/comms/share";
import { createBlob, createFile, getDocument, getNavigator } from "packages/utils/core/platform";

function getAddressForFilename(selectedHome: unknown): string {
  if (isObject(selectedHome)) {
    const h = selectedHome as { address?: string };
    if (h && typeof h === "object" && "address" in h && typeof h.address === "string") {
      return h.address;
    }
  }
  if (selectedHome && typeof selectedHome === "string") return selectedHome;
  if (selectedHome) return JSON.stringify(selectedHome);
  return "strategy";
}

export function downloadStrategyJson(strategyData: unknown, selectedHome: unknown): void {
  if (!strategyData) {
    log.warn("NEGOTIATION", "No strategy data to download");
    return;
  }

  try {
    const dataStr = JSON.stringify(strategyData, null, 2);
    const dataBlob = createBlob([dataStr], { type: "application/json" });
    const url =
      typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(dataBlob) : null;

    if (!url) throw new Error("URL.createObjectURL is not available");

    const doc = getDocument();
    if (!doc?.body) throw new Error("Document body not available");
    const link = doc.createElement("a");
    link.href = url;
    const address = getAddressForFilename(selectedHome);
    link.download = `negotiation-strategy-${
      typeof address === "string" ? address.replace(/[^a-zA-Z0-9]/g, "-") : "strategy"
    }.json`;
    doc.body.appendChild(link);
    link.click();
    doc.body.removeChild(link);
    URL.revokeObjectURL(url);

    log.info("NEGOTIATION", "Strategy JSON downloaded successfully");
  } catch (error: unknown) {
    log.error("ERRORS", "Failed to download strategy JSON", error);
  }
}

export async function shareStrategyJson(
  strategyData: unknown,
  selectedHome: unknown
): Promise<void> {
  if (!strategyData) {
    log.warn("NEGOTIATION", "No strategy data to share");
    return;
  }

  try {
    const dataStr = JSON.stringify(strategyData, null, 2);
    const address = getAddressForFilename(selectedHome);

    const nav = getNavigator();
    const fileShareData: ShareData = {
      title: "Negotiation Strategy",
      text: `Negotiation strategy for ${address}`,
      files: [
        createFile([dataStr], "negotiation-strategy.json", {
          type: "application/json",
        }),
      ],
    };

    if (nav?.share && typeof nav.canShare === "function" && nav.canShare(fileShareData)) {
      const fileResult = await tryWebShare(fileShareData);
      if (fileResult === "shared") {
        log.info("NEGOTIATION", "Strategy shared successfully via Web Share API");
        return;
      }
      if (fileResult === "aborted") {
        return;
      }
      log.warn("NEGOTIATION", "Web Share API file share failed or unavailable, trying text share");
    }

    const textShareData: ShareData = {
      title: "Negotiation Strategy",
      text: `Negotiation strategy for ${address}:\n\n${dataStr}`,
    };
    const textResult = await tryWebShare(textShareData);
    if (textResult === "shared") {
      log.info("NEGOTIATION", "Strategy shared as text via Web Share API");
      return;
    }
    if (textResult === "aborted") {
      return;
    }
    log.warn("NEGOTIATION", "Text Web Share unavailable or failed, falling back to clipboard");

    const copied = await secureClipboardCopy(dataStr);
    if (copied) {
      log.info("NEGOTIATION", "Strategy copied to clipboard as fallback");
    } else {
      log.warn("NEGOTIATION", "Strategy share fallback: clipboard copy unsuccessful");
    }
  } catch (error: unknown) {
    log.error("ERRORS", "Failed to share strategy", error);
  }
}
