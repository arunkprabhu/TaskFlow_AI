/**
 * Task-related TypeScript types
 */

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  due_date?: string;
  priority: PriorityLevel;
  confidence: number;
}

export interface TaskExtractionRequest {
  meeting_notes: string;
  options?: {
    model?: string;
    confidence_threshold?: number;
  };
}

export interface TaskExtractionResponse {
  tasks: Task[];
  metadata: {
    model_used: string;
    processing_time_ms: number;
    total_tasks: number;
  };
}

export interface MondayColumnMapping {
  status?: string;
  assignee?: string;
  due_date?: string;
}

export interface PushToMondayRequest {
  tasks: Task[];
  board_id?: string;
  api_token?: string;
  column_mapping?: MondayColumnMapping;
}

export interface MondayCreatedItem {
  task_id: string;
  monday_item_id: string;
  url?: string;
}

export interface PushToMondayResponse {
  success: boolean;
  created_items: MondayCreatedItem[];
  errors: Array<{ message: string }>;
}

export interface HealthStatus {
  status: string;
  services: {
    ollama: {
      status: string;
      url: string;
      model: string;
    };
    monday: {
      status: string;
      url: string;
    };
  };
  environment: string;
}
