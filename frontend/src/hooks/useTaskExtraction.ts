/**
 * Custom hook for task extraction
 */

import { useState } from 'react';
import { extractTasks } from '../services/api';
import type { Task, TaskExtractionRequest } from '../types/task.types';

interface UseTaskExtractionResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  extractTasksFromNotes: (meetingNotes: string) => Promise<void>;
  clearError: () => void;
}

export const useTaskExtraction = (): UseTaskExtractionResult => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractTasksFromNotes = async (meetingNotes: string) => {
    if (!meetingNotes.trim()) {
      setError('Please enter meeting notes');
      return;
    }

    setIsLoading(true);
    setError(null);

    const request: TaskExtractionRequest = {
      meeting_notes: meetingNotes,
      options: { confidence_threshold: 0.3 },
    };

    try {
      const response = await extractTasks(request);
      setTasks(response.tasks);

      if (response.tasks.length === 0) {
        setError('No tasks found in the meeting notes. Try adding clearer action items.');
      }
    } catch (err: any) {
      console.error('Task extraction failed:', err);

      // Auto-retry once on network error (backend may have just restarted)
      const isNetworkErr = err.message?.includes('Network Error') || err.code === 'ERR_NETWORK';
      if (isNetworkErr) {
        try {
          await new Promise(r => setTimeout(r, 2000));
          const retry = await extractTasks(request);
          setTasks(retry.tasks);
          if (retry.tasks.length === 0) {
            setError('No tasks found in the meeting notes. Try adding clearer action items.');
          }
          return;
        } catch (_) { /* fall through to error display */ }
      }

      let errorMessage = '';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'API endpoint not found. Ensure the backend is running on port 8000.';
      } else if (err.response?.status === 500) {
        errorMessage = err.response?.data?.detail || 'Server error. Check backend logs.';
      } else if (isNetworkErr) {
        errorMessage = 'Cannot reach the backend on port 8000. Please restart it and try again.';
      } else {
        errorMessage = err.response?.data?.detail || 'Extraction failed. Please try again.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    tasks,
    isLoading,
    error,
    extractTasksFromNotes,
    clearError,
  };
};
