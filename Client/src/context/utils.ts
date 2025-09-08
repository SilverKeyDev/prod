import { apiRequest, userApi } from "../api";
import { formatFilenameToAddress } from "../lib/addressFormat";

// Import and re-export all types from centralized location
import type { 
  Report, 
  CompareReport, 
  Strategy,
  MarketInsight,
  UserProfile, 
  UserPreferences, 
  Agent, 
  Activity, 
  Notification,
  Property, 
  SavedHome, 
  SearchQuery, 
  SavedSearch, 
  PriceHistory, 
  MarketTrend, 
  NeighborhoodStats,
  OfferDraft, 
  OfferHistory,
  Document, 
  DocumentCategory, 
  UploadedFile,
  BillingInfo,
  Chat,
  ApiSuccess, 
  ApiError, 
  ApiResponse,
  BASE_URL
} from '../types';

export type {
  Report, 
  CompareReport, 
  Strategy,
  MarketInsight,
  UserProfile, 
  UserPreferences, 
  Agent, 
  Activity, 
  Notification,
  Property, 
  SavedHome, 
  SearchQuery, 
  SavedSearch, 
  PriceHistory, 
  MarketTrend, 
  NeighborhoodStats,
  OfferDraft, 
  OfferHistory,
  Document, 
  DocumentCategory, 
  UploadedFile,
  BillingInfo,
  Chat,
  ApiSuccess, 
  ApiError, 
  ApiResponse
};

export { BASE_URL };

// Keep IsochroneData here since it has different structure than types/search.ts

export interface IsochroneData {
  id: string;
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  commute_time: number;
  polygon: any; // GeoJSON polygon
  created_at: Date;
}

/* =========================
   Shared Utilities
   ========================= */

export function getIdToken(): string | null {
  return localStorage.getItem("id_token");
}

export function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Legacy fetchJson - use api/utils.ts for new code
export async function fetchJson<T>(
  input: RequestInfo,
  init: RequestInit,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(input, { ...init, signal });
  const json = await res.json();
  return json as T;
}

export function createAbortManager() {
  const controllers = new Set<AbortController>();
  
  const abortAll = () => controllers.forEach((c) => c.abort());
  
  const withAbort = <T,>(fn: (signal: AbortSignal) => Promise<T>) => {
    const controller = new AbortController();
    controllers.add(controller);
    return fn(controller.signal).finally(() => controllers.delete(controller));
  };
  
  return { abortAll, withAbort };
}

export function isAbortError(error: any): boolean {
  return error?.name === "AbortError";
}

/* =========================
   Serializers
   ========================= */

export const deserializeReport = (r: any): Report => ({
  id: r.id,
  address: r.address,
  status: r.status,
  pdfUrl: r.pdfUrl ?? null,
  s3Key: r.s3Key ?? null,
  generatedAt: new Date(r.generatedAt ? r.generatedAt * 1000 : Date.now()),
});

export const deserializeCompareReport = (r: any): CompareReport => ({
  id: r.id,
  address: r.address,
  generatedAt: new Date(r.generatedAt ? r.generatedAt * 1000 : Date.now()),
  status: r.status,
  pdfUrl: r.pdfUrl ?? null,
  s3Key: r.s3Key ?? null,
  price: r.price,
  squareFootage: r.squareFootage,
  yearBuilt: r.yearBuilt,
  propertyType: r.propertyType,
  estimatedValue: r.estimatedValue,
  neighborhoodScore: r.neighborhoodScore,
  schoolScore: r.schoolScore,
});

export const mapHomeUniversalToSavedHome = (home: any, index: number): SavedHome => ({
  home_id: home.address || `home_${index}_${Date.now()}`,
  description: home.address || "",
  address: home.address || "",
  price: home.price ?? "",
  bedrooms: Number.parseInt(home.beds) || 0,
  bathrooms: Number.parseInt(home.baths) || 0,
  sqft: Number.parseInt(home.sqft) || 0,
  lot_size: home.lot_size || "",
  image_url: home.image_url || undefined,
  lat: home.lat || 0,
  lng: home.lng || 0,
  ...home,
});

export const unixSecsToDate = (secs: number): Date => new Date(secs * 1000);

export const toInt = (val: any): number => Number.parseInt(val) || 0;

export const toNumber = (val: any): number => Number(val) || 0;

/* =========================
   API Helpers
   ========================= */

export { apiRequest, userApi, formatFilenameToAddress };
