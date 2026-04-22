/**
 * API client service for backend communication
 */

import axios from 'axios';
import type {
  TaskExtractionRequest,
  TaskExtractionResponse,
  PushToMondayRequest,
  PushToMondayResponse,
  HealthStatus,
} from '../types/task.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 200000, // 200 seconds - allow time for first-time model loading
});

/**
 * Extract tasks from meeting notes (instant Python NLP)
 */
export const extractTasks = async (
  request: TaskExtractionRequest
): Promise<TaskExtractionResponse> => {
  const response = await api.post<TaskExtractionResponse>('/api/extract-tasks', request);
  return response.data;
};

/**
 * Push tasks to Monday.com
 */
export const pushToMonday = async (
  request: PushToMondayRequest
): Promise<PushToMondayResponse> => {
  const response = await api.post<PushToMondayResponse>('/api/push-to-monday', request);
  return response.data;
};

/**
 * Get board columns information
 */
export const getBoardColumns = async (boardId: string): Promise<any> => {
  const response = await api.get(`/api/board/${boardId}/columns`);
  return response.data;
};

/**
 * Check health status
 */
export const getHealthStatus = async (): Promise<HealthStatus> => {
  const response = await api.get<HealthStatus>('/api/health');
  return response.data;
};

export default api;
