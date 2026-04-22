/**
 * Custom hook for pushing tasks to Monday.com
 */

import { useState } from 'react';
import { pushToMonday } from '../services/api';
import type { Task, PushToMondayRequest } from '../types/task.types';

interface UseMondayPushResult {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  pushTasks: (tasks: Task[], boardId?: string) => Promise<void>;
  clearStatus: () => void;
}

export const useMondayPush = (): UseMondayPushResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pushTasks = async (tasks: Task[], boardId?: string) => {
    if (!tasks || tasks.length === 0) {
      setError('No tasks to push');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Resolve API token — try pm_tool_credentials first, then direct MONDAY_API_TOKEN key
      let apiToken = '';
      let defaultBoardId = boardId;

      const credentials = localStorage.getItem('pm_tool_credentials');
      if (credentials) {
        try {
          const creds = JSON.parse(credentials);
          apiToken = creds.apiToken || '';
          defaultBoardId = boardId || creds.boardId || '';
        } catch (e) {
          console.error('Failed to parse credentials:', e);
        }
      }

      // Fallback: token saved directly (e.g. after re-opening the modal)
      if (!apiToken) {
        apiToken = localStorage.getItem('MONDAY_API_TOKEN') || '';
      }
      if (!defaultBoardId) {
        defaultBoardId = localStorage.getItem('MONDAY_BOARD_ID') || boardId;
      }

      if (!apiToken) {
        setError('API token not found. Please reconnect your account via the Connect button.');
        setIsLoading(false);
        return;
      }

      const request: PushToMondayRequest = {
        tasks,
        board_id: defaultBoardId,
        api_token: apiToken,
      };

      const response = await pushToMonday(request);

      if (response.success) {
        setSuccess(true);
      } else {
        const msg = response.errors?.[0]?.message || 'Some tasks could not be created.';
        setError(msg);
      }
    } catch (err: any) {
      console.error('Monday.com push failed:', err);
      const detail =
        err.response?.data?.detail ||
        err.message ||
        'Unknown error';
      setError(`Push failed: ${detail}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStatus = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    isLoading,
    error,
    success,
    pushTasks,
    clearStatus,
  };
};
