/**
 * User API request/response types (single source of truth for config/api and apps).
 */
import type { SavedHome } from "packages/types/savedHome";

export type User = {
  id: string;
  cognito_id?: string | null;
  email: string;
  name: string;
  phone?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  is_active: boolean;
  is_agent?: boolean;
  is_closing_mode?: boolean;
  /** API stores as Text — may be comma-separated string or (if ever) array. */
  client_ids?: string[] | string | null;
  agency_name?: string;
  has_subscription?: boolean;
  subscription?: unknown;
  has_preferences?: boolean;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
};

export type UserResponse = {
  success: boolean;
  user?: User;
  data?: User;
  message?: string;
  error?: string;
};

export type FavoriteHomesResponse = {
  success: boolean;
  favorites?: string[];
  homes?: SavedHome[];
  message?: string;
  error?: string;
};

export type NotInterestedHomeItem = {
  id?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  zpid?: string;
  mls_home_id?: string;
  [key: string]: unknown;
};

export type NotInterestedHomesResponse = {
  success: boolean;
  notInterested?: NotInterestedHomeItem[];
  message?: string;
  error?: string;
};

export type AddFavoriteRequest = {
  home: unknown;
  /** When set, an agent saves to this client's favorites (server validates roster). */
  client_id?: string;
};

export type RemoveFavoriteRequest = {
  address: string;
  client_id?: string;
};

export type AddNotInterestedRequest = {
  home: unknown;
  why?: string;
};

export type RemoveNotInterestedRequest = {
  address: string;
};

export type UpdateNotInterestedRequest = {
  address: string;
  why: string;
};
