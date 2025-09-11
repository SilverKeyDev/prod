import { apiPost, apiGet } from './utils/index';

// Types for home matching API
interface UserMatchingData {
  preferences?: Record<string, unknown>;
  demographics?: Record<string, unknown>;
  financial?: Record<string, unknown>;
}

interface HomeData {
  id?: string;
  address?: string;
  price?: number;
  features?: Record<string, unknown>;
}

interface MatchingResult {
  ranked_homes?: Array<{
    home_id: string;
    score: number;
    explanation?: string;
  }>;
  scores?: Record<string, number>;
  explanations?: Record<string, string>;
}

interface TaskMeta {
  progress?: number;
  current_step?: string;
  total_steps?: number;
  estimated_completion?: string;
}

export interface HomeMatchingRequest {
  user_data: UserMatchingData;
  homes_data: HomeData[];
  top_k?: number;
  include_explanations?: boolean;
  method_weights?: {
    embedding?: number;
    tabular?: number;
    llm?: number;
  };
  embedding_provider?: string;
  llm_provider?: string;
}

export interface HomeMatchingResponse {
  success: boolean;
  task_id: string;
  status: string;
  message: string;
  user_id?: string;
  homes_count?: number;
  top_k?: number;
  include_explanations?: boolean;
}

export interface TaskStatusResponse {
  success: boolean;
  task_id: string;
  status: 'SUCCESS' | 'PENDING' | 'PROGRESS' | 'FAILURE';
  result?: MatchingResult;
  meta?: TaskMeta;
  message?: string;
  error?: string;
}

/**
 * Home Matching API client using centralized utilities
 */
export const homeMatchingApi = {
  /**
   * Start a background task to find the best home matches for a user
   */
  findMatches: (data: HomeMatchingRequest): Promise<HomeMatchingResponse> =>
    apiPost<HomeMatchingResponse>('/api/home-matching/find-matches', data),

  /**
   * Get the status of a home matching task
   */
  getTaskStatus: (taskId: string): Promise<TaskStatusResponse> =>
    apiGet<TaskStatusResponse>(`/api/home-matching/task-status/${taskId}`),
};