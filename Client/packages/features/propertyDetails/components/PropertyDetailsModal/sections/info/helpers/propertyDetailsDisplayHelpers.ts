/**
 * Shared display helpers for PropertyFeatures (and related) and PropertyBasicInfo sections.
 * Extracted to satisfy max-lines-per-function.
 */
import React from "react";

export function asReactNode(v: unknown): React.ReactNode {
  if (React.isValidElement(v)) return v;
  if (typeof v === "string" || typeof v === "number") return v;
  if (v === null || v === undefined) return "-";
  if (typeof v === "boolean") return v ? "true" : "false";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function safeStringify(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[Object]";
    }
  }
  return "[Unknown]";
}

export function formatAgentPhoneNumber(ph: Record<string, unknown> | string | undefined): string {
  if (!ph) return "";
  if (typeof ph === "string") {
    const s = ph.trim();
    return s || "";
  }
  const { areacode, prefix, number } = ph as {
    areacode?: unknown;
    prefix?: unknown;
    number?: unknown;
  };
  if (areacode && prefix && number) {
    return `(${safeStringify(areacode)}) ${safeStringify(prefix)}-${safeStringify(number)}`;
  }
  return (
    (typeof areacode === "string" ? areacode : null) ??
    (typeof prefix === "string" ? prefix : null) ??
    (typeof number === "string" ? number : null) ??
    ""
  );
}

function pickTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  return s || undefined;
}

function firstNonEmptyString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = pickTrimmedString(obj[k]);
    if (v) return v;
  }
  return undefined;
}

/** RESO/MLS feeds often nest photo under objects or use alternate key names. */
const LISTING_AGENT_IMAGE_KEYS = [
  "photo",
  "photoUrl",
  "photoURL",
  "imageUrl",
  "imageURL",
  "image",
  "picture",
  "headshot",
  "headshotUrl",
  "profilePhotoUrl",
  "profileUrl",
  "agentPhoto",
  "memberPhotoUrl",
  "MemberPhotoURL",
] as const;

function extractImageUrlFromUnknown(value: unknown): string | undefined {
  const direct = pickTrimmedString(value);
  if (direct) return direct;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    return firstNonEmptyString(o, ["url", "href", "src", "uri", "URL", "Uri", "link"]);
  }
  return undefined;
}

function imageUrlFromAgentRecord(o: Record<string, unknown>): string | undefined {
  for (const k of LISTING_AGENT_IMAGE_KEYS) {
    const v = o[k];
    const u = extractImageUrlFromUnknown(v);
    if (u) return u;
  }
  const media = o.media ?? o.photos ?? o.Media;
  if (Array.isArray(media) && media.length > 0) {
    const first = extractImageUrlFromUnknown(media[0]);
    if (first) return first;
  }
  return undefined;
}

function agentNameFromListingAgent(o: Record<string, unknown>): string | undefined {
  const direct = firstNonEmptyString(o, ["name", "fullName", "displayName", "agentName"]);
  if (direct) return direct;
  const first = pickTrimmedString(o.firstName);
  const last = pickTrimmedString(o.lastName);
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return undefined;
}

function parsePhoneField(v: unknown): Record<string, unknown> | string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const s = v.trim();
    return s || undefined;
  }
  if (typeof v === "object") return v as Record<string, unknown>;
  return undefined;
}

function readSlipstreamListingAgent(property: Record<string, unknown>): {
  displayName?: string;
  imageUrl?: string;
  phone?: Record<string, unknown> | string;
  email?: string;
} | null {
  const la = property.listingAgent ?? property.listing_agent;
  if (!la || typeof la !== "object") return null;
  const o = la as Record<string, unknown>;
  return {
    displayName: agentNameFromListingAgent(o),
    imageUrl: imageUrlFromAgentRecord(o),
    phone: parsePhoneField(o.phone ?? o.telephone ?? o.mobile ?? o.workPhone ?? o.cellPhone),
    email: firstNonEmptyString(o, ["email", "emailAddress"]),
  };
}

function readSlipstreamListingOffice(property: Record<string, unknown>): string | undefined {
  const lo = property.listingOffice;
  if (!lo || typeof lo !== "object") return undefined;
  const o = lo as Record<string, unknown>;
  return firstNonEmptyString(o, ["name", "company", "brokerageName", "officeName", "firmName"]);
}

/** MLS / Slipstream listing number when present (not necessarily distinct from provider id). */
export function getMlsListingId(property: unknown): string | undefined {
  const p = property as Record<string, unknown>;
  const raw = p.mls_home_id ?? p.mlsid ?? p.mlsId;
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  return s || undefined;
}

/** Human-readable listing status for MLS snapshots (e.g. FOR_SALE → "For Sale"). */
export function formatListingStatusLabel(raw: string | undefined): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  return s
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function getAgentFromProperty(property: unknown): {
  hasAgent: boolean;
  imageUrl: string | undefined;
  displayName: string | undefined;
  businessName: string | undefined;
  phone: Record<string, unknown> | string | undefined;
  email: string | undefined;
} {
  const p = property as Record<string, unknown>;
  const listedBy = p.listed_by;
  const zillowAgent =
    listedBy && typeof listedBy === "object" && listedBy !== null
      ? (listedBy as Record<string, unknown>)
      : null;

  const slip = readSlipstreamListingAgent(p);
  const officeName = readSlipstreamListingOffice(p);
  const flatBrokerage = pickTrimmedString(p.brokerage);
  const flatAgentPhone = parsePhoneField(p.listing_agent_phone);
  const flatAgentEmail = pickTrimmedString(p.listing_agent_email);

  const displayName =
    slip?.displayName ??
    (zillowAgent ? pickTrimmedString(zillowAgent.display_name) : undefined) ??
    pickTrimmedString(p.listingAgentName);

  const businessName =
    officeName ??
    flatBrokerage ??
    (zillowAgent ? pickTrimmedString(zillowAgent.business_name) : undefined);

  const phone = slip?.phone ?? parsePhoneField(zillowAgent?.phone) ?? flatAgentPhone;

  const email = slip?.email ?? flatAgentEmail ?? pickTrimmedString(p.listingAgentEmail);

  const imageUrl =
    slip?.imageUrl ??
    (zillowAgent
      ? (firstNonEmptyString(zillowAgent as Record<string, unknown>, [
          "image_url",
          "imageUrl",
          "profile_photo_url",
          "photo_url",
          "headshot_url",
        ]) ?? imageUrlFromAgentRecord(zillowAgent as Record<string, unknown>))
      : undefined);

  const hasAgent = !!(displayName || businessName || formatAgentPhoneNumber(phone) || email);

  return {
    hasAgent,
    imageUrl,
    displayName,
    businessName,
    phone,
    email,
  };
}

/** True when `price` parses to a positive finite listing amount (for display / loading gates). */
export function hasRenderableListingPrice(price: unknown): boolean {
  if (price === null || price === undefined || price === "") return false;
  const numPrice =
    typeof price === "string" ? parseFloat(price.replace(/[^0-9.-]+/g, "")) : Number(price);
  return Number.isFinite(numPrice) && numPrice > 0;
}

/** Extract basic display fields from property to reduce branching in components. */
export function getPropertyBasicFields(property: Record<string, unknown>): {
  price: number | string | undefined;
  sqft: number | string | undefined;
  bedrooms: number | string | undefined;
  bathrooms: number | string | undefined;
  yearBuilt: number | string | undefined;
  lotSize: number | string | undefined;
  homeType: string | undefined;
  propertyType: string | undefined;
  pricePerSquareFoot: number | string | undefined;
  garageSpaces: number | undefined;
  parking: number | undefined;
  zestimate: number | undefined;
  rentZestimate: number | undefined;
} {
  return {
    price: property.price as number | string | undefined,
    sqft: property.sqft as number | string | undefined,
    bedrooms: property.bedrooms as number | string | undefined,
    bathrooms: property.bathrooms as number | string | undefined,
    yearBuilt: property.yearBuilt as number | string | undefined,
    lotSize: property.lotSize as number | string | undefined,
    homeType: property.homeType as string | undefined,
    propertyType: property.propertyType as string | undefined,
    pricePerSquareFoot: property.pricePerSquareFoot as number | string | undefined,
    garageSpaces: property.garageSpaces as number | undefined,
    parking: property.parking as number | undefined,
    zestimate: property.zestimate as number | undefined,
    rentZestimate: property.rentZestimate as number | undefined,
  };
}

export type PropertyBasicDisplayFields = ReturnType<typeof getPropertyBasicFields>;
