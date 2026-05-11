/**
 * Helpers for ShareHomeModal; extracted to satisfy max-lines-per-function.
 */
import type { SearchResult } from "packages/features/search/types";
import type { Property } from "packages/features/search/types";
import { formatAddress } from "packages/utils/format/property/propertyDetailsDisplayFormatters";

export function getShareHomePropertyId(property: Property | SearchResult | null): string | null {
  if (!property) return null;
  if ("zpid" in property && property.zpid) return String(property.zpid);
  if ("id" in property && property.id) return property.id;
  const addr = property.address;
  if (addr != null) {
    const str = typeof addr === "string" ? addr : formatAddress(addr);
    return str || null;
  }
  return null;
}

export function getShareHomeConversationId(
  conversations: Array<{ id: string; client_id?: string }>,
  clientId: string
): string | null {
  const conversation = conversations.find((c) => c.client_id === clientId);
  return conversation?.id ?? null;
}
