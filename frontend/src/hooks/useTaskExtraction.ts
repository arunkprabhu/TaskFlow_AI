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

    try {
      const request: TaskExtractionRequest = {
        meeting_notes: meetingNotes,
        options: {
          confidence_threshold: 0.3,
        },
      };

      const response = await extractTasks(request);
      setTasks(response.tasks);

      if (response.tasks.length === 0) {
        setError('No tasks found in the meeting notes. Try adding clearer action items.');
      }
    } catch (err: any) {
      console.error('Task extraction failed:', err);

      let errorMessage = 'Failed to extract tasks. ';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage += 'The request timed out. Please try again.';
      } else if (err.response?.status === 404) {
        errorMessage += 'API endpoint not found. Please check the backend is running.';
      } else if (err.response?.status === 500) {
        errorMessage += err.response?.data?.detail || 'Server error occurred.';
      } else if (err.message?.includes('Network Error')) {
        errorMessage += 'Cannot connect to backend. Make sure it is running on port 8000.';
      } else {
        errorMessage += err.response?.data?.detail || 'Please try again.';
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
