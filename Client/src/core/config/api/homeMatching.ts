import { apiPost, apiGet } from '../../services/http/compatibility';

// Types for home matching API
export type HomeMatchingRequest = {
  user_data: Record<string, unknown>;
  homes_data: unknown[];
  top_k?: number;
  include_explanations?: boolean;
  method_weights?: {
    embedding?: number;
    tabular?: number;
    llm?: number;
  };
  embedding_provider?: string;
  llm_provider?: string;
};

export type HomeMatchingResponse = {
  success: boolean;
  task_id: string;
  status: string;
  message: string;
  user_id?: string;
  homes_count?: number;
  top_k?: number;
  include_explanations?: boolean;
};

export type TaskStatusResponse = {
  success: boolean;
  task_id: string;
  status: 'SUCCESS' | 'PENDING' | 'PROGRESS' | 'FAILURE';
  result?: unknown;
  meta?: unknown;
  message?: string;
  error?: string;
};

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
