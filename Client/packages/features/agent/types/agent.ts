import type { TodoItem as ApiTodoItem } from "packages/features/agent/api/agent";

// Agent type (app-level UI type - extends API agent data)
export type Agent = {
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
};

// Todo types (re-exported from API for feature consumers)
export type TodoItem = ApiTodoItem;
export type TodoType = ApiTodoItem["type"];
