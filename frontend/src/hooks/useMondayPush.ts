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
      // Get API token from localStorage
      const credentials = localStorage.getItem('pm_tool_credentials');
      let apiToken = '';
      let defaultBoardId = boardId;

      if (credentials) {
        try {
          const creds = JSON.parse(credentials);
          apiToken = creds.apiToken || '';
          defaultBoardId = boardId || creds.boardId || '';
        } catch (e) {
          console.error('Failed to parse credentials:', e);
        }
      }

      if (!apiToken) {
        setError('Please connect your Monday.com account first in the connection modal.');
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
        setError(response.errors[0]?.message || 'Failed to create some tasks');
      }
    } catch (err: any) {
      console.error('Monday.com push failed:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to push tasks to Monday.com. Check your API token and board ID.'
      );
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
