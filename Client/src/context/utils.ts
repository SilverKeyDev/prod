import { apiRequest, favoriteHomesApi } from "../lib/api";
import { formatFilenameToAddress } from "../lib/addressFormat";

/* =========================
   Types
   ========================= */

export interface Report {
  id: string;
  address: string;
  generatedAt: Date;
  status: "completed" | "generating" | "error";
  pdfUrl?: string | null;
  s3Key?: string | null;
}

export interface CompareReport {
  id: string;
  address: string;
  generatedAt: Date;
  status: "generating" | "completed" | "error";
  pdfUrl?: string | null;
  s3Key?: string | null;
  price?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: string;
  estimatedValue?: number;
  neighborhoodScore?: number;
  schoolScore?: number;
}

export interface BillingInfo {
  subscription: {
    status: string;
    plan_id: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    reports_limit: number;
    stripe_subscription_id: string | null;
    plan: {
      name: string;
      price: number;
      interval: string;
    };
  } | null;
  usage: {
    reports_generated: number;
  };
  has_active_subscription: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: string | null;
  is_active: boolean;
  has_subscription: boolean;
  subscription: any;
  has_preferences: boolean;
  is_agent: boolean;
  agent_id?: string;
  client_ids?: string;
}

export interface UserPreferences {
  demographics?: any;
  financial_profile?: any;
  housing_preferences?: any;
  location_preferences?: any;
  lifestyle_preferences?: any;
  behavioral_patterns?: any;
  real_estate?: any;
  agent_preferences?: any;
  values?: any;
  emotional_signals?: any;
  report_section_priorities?: any;
  [key: string]: any;
}

export interface Chat {
  id: string;
  title: string;
  propertyAddress: string;
  messages: any[];
  createdAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  license_number?: string;
  brokerage?: string;
  specialties?: string[];
  rating?: number;
  reviews_count?: number;
  profile_image?: string;
  bio?: string;
  years_experience?: number;
  client_ids?: string[];
}

export interface Property {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lot_size?: string;
  year_built?: number;
  property_type: string;
  listing_status: string;
  mls_id?: string;
  images?: string[];
  description?: string;
  lat: number;
  lng: number;
  neighborhood?: string;
  school_district?: string;
  hoa_fees?: number;
  property_taxes?: number;
  days_on_market?: number;
  listing_agent?: Agent;
}

export interface SearchQuery {
  id: string;
  name?: string;
  filters: {
    min_price?: number;
    max_price?: number;
    bedrooms?: number;
    bathrooms?: number;
    property_type?: string[];
    location?: string;
    radius?: number;
  };
  created_at: Date;
  results_count?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  email_alerts: boolean;
  created_at: Date;
  last_run?: Date;
}

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

export interface OfferDraft {
  id: string;
  property_id: string;
  property_address: string;
  offer_price: number;
  earnest_money: number;
  down_payment: number;
  financing_type: string;
  closing_date: string;
  inspection_period: number;
  appraisal_contingency: boolean;
  financing_contingency: boolean;
  sale_contingency: boolean;
  inclusions: string[];
  exclusions: string[];
  special_terms?: string;
  cover_letter?: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'countered';
  created_at: Date;
  updated_at: Date;
}

export interface Strategy {
  id: string;
  property_address: string;
  strategy_type: 'negotiation' | 'offer' | 'inspection';
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action_items: string[];
  }[];
  market_analysis: {
    comparable_sales: any[];
    market_trends: string;
    pricing_strategy: string;
  };
  created_at: Date;
}

export interface OfferHistory {
  id: string;
  property_id: string;
  offer_price: number;
  status: string;
  submitted_at: Date;
  response_date?: Date;
  counter_offer?: number;
  notes?: string;
}

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  property_id?: string;
  offer_id?: string;
  uploaded_by: string;
  uploaded_at: Date;
  is_signed?: boolean;
  expiry_date?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required_for: string[]; // e.g., ['offer', 'closing', 'inspection']
  template_url?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'report' | 'offer' | 'document' | 'system' | 'agent';
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  created_at: Date;
  expires_at?: Date;
}

export interface Activity {
  id: string;
  user_id: string;
  action: string;
  description: string;
  entity_type: string; // 'report', 'offer', 'document', etc.
  entity_id: string;
  metadata?: any;
  created_at: Date;
}

export interface MarketTrend {
  id: string;
  location: string;
  time_period: string;
  median_price: number;
  price_change_percent: number;
  inventory_levels: number;
  days_on_market: number;
  sale_to_list_ratio: number;
  updated_at: Date;
}

export interface NeighborhoodStats {
  id: string;
  neighborhood: string;
  city: string;
  state: string;
  median_home_value: number;
  median_rent: number;
  population: number;
  median_age: number;
  median_income: number;
  crime_rate: number;
  school_rating: number;
  walkability_score: number;
  updated_at: Date;
}

export interface PriceHistory {
  id: string;
  property_id: string;
  price: number;
  date: Date;
  event_type: 'listed' | 'price_change' | 'sold' | 'withdrawn';
  source: string;
}

export interface MarketInsight {
  id: string;
  title: string;
  content: string;
  insight_type: 'trend' | 'opportunity' | 'warning' | 'tip';
  location?: string;
  property_type?: string;
  relevance_score: number;
  created_at: Date;
  expires_at?: Date;
}

export interface SavedHome {
  home_id: string;
  description?: string;
  image_url?: string;
  price?: string | number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lat?: number;
  lng?: number;
  address?: string;
  [key: string]: any;
}

export interface ApiSuccess<T> {
  success: true;
  [k: string]: any;
  data?: T;
}

export interface ApiError {
  success: false;
  error?: string;
  [k: string]: any;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/* =========================
   Shared Utilities
   ========================= */

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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

// Legacy fetchJson - use fetchUtils.ts for new code
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

export { apiRequest, favoriteHomesApi, formatFilenameToAddress };
