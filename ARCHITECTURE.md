# meetingtotask - Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         React Frontend (TypeScript + MUI)              │    │
│  │  - Meeting notes input                                 │    │
│  │  - Task preview/editing                                │    │
│  │  - Monday.com integration UI                           │    │
│  └─────────────────┬──────────────────────────────────────┘    │
└────────────────────┼───────────────────────────────────────────┘
                     │ HTTP/REST
                     │
┌────────────────────▼───────────────────────────────────────────┐
│                  FastAPI Backend (Python)                       │
│                                                                  │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │  Task Extractor  │  │  Ollama Client  │  │ Monday Client│  │
│  │   Controller     │──│   (AI Agent)    │  │   (GraphQL)  │  │
│  └──────────────────┘  └─────────────────┘  └──────────────┘  │
│                                │                     │          │
└────────────────────────────────┼─────────────────────┼──────────┘
                                 │                     │
                    ┌────────────▼────────┐  ┌─────────▼─────────┐
                    │   Ollama Server     │  │   Monday.com API  │
                    │   (Local LLM)       │  │   (Cloud)         │
                    │   Port: 11434       │  │   GraphQL         │
                    └─────────────────────┘  └───────────────────┘
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **Axios** for HTTP requests
- **React Hook Form** for form management
- **Date-fns** for date handling
- **Vite** for build tooling

### Backend
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **httpx** - Async HTTP client for Ollama
- **python-dotenv** - Environment configuration
- **uvicorn** - ASGI server

### AI Layer
- **Ollama** - Local LLM runtime
- Models: llama3, mistral, or similar
- REST API integration (http://localhost:11434)

### External Integration
- **Monday.com GraphQL API**
- OAuth/API token authentication

## Data Flow

### 1. Task Extraction Flow
```
User Input (Meeting Notes)
    │
    ├─> Frontend validates input
    │
    ├─> POST /api/extract-tasks
    │
    ├─> Backend receives request
    │
    ├─> Ollama Client sends prompt
    │
    ├─> Ollama processes with LLM
    │
    ├─> Returns structured JSON
    │
    ├─> Backend validates/sanitizes
    │
    └─> Frontend displays editable tasks
```

### 2. Monday.com Push Flow
```
Edited Tasks
    │
    ├─> POST /api/push-to-monday
    │
    ├─> Backend receives tasks
    │
    ├─> Monday Client validates board config
    │
    ├─> GraphQL mutations for each task
    │
    ├─> Monday.com creates items
    │
    └─> Frontend shows success/errors
```

## Component Architecture

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── MeetingNotesInput.tsx    # Text area + extract button
│   │   ├── TaskPreviewTable.tsx      # Editable task grid
│   │   ├── TaskRow.tsx               # Single task editor
│   │   ├── PushToMondayButton.tsx    # Integration trigger
│   │   └── LoadingSpinner.tsx        # Loading states
│   ├── services/
│   │   └── api.ts                    # Backend API client
│   ├── types/
│   │   └── task.types.ts             # TypeScript interfaces
│   ├── hooks/
│   │   ├── useTaskExtraction.ts      # Task extraction logic
│   │   └── useMondayPush.ts          # Monday integration
│   ├── App.tsx                       # Main application
│   └── main.tsx                      # Entry point
```

### Backend Structure
```
backend/
├── app/
│   ├── main.py                       # FastAPI app setup
│   ├── config.py                     # Configuration management
│   ├── api/
│   │   ├── routes/
│   │   │   ├── tasks.py              # Task endpoints
│   │   │   └── health.py             # Health check
│   │   └── deps.py                   # Dependencies
│   ├── services/
│   │   ├── ollama_client.py          # Ollama integration
│   │   ├── monday_client.py          # Monday.com API
│   │   └── task_processor.py        # Task validation
│   ├── models/
│   │   └── task.py                   # Pydantic models
│   └── prompts/
│       └── extraction_prompt.py      # AI prompts
```

## API Endpoints

### POST /api/extract-tasks
**Request:**
```json
{
  "meeting_notes": "string",
  "options": {
    "model": "llama3",
    "confidence_threshold": 0.7
  }
}
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "owner": "string | null",
      "due_date": "2026-04-30 | null",
      "priority": "High | Medium | Low",
      "confidence": 0.85
    }
  ],
  "metadata": {
    "model_used": "llama3",
    "processing_time_ms": 1234
  }
}
```

### POST /api/push-to-monday
**Request:**
```json
{
  "tasks": [...],
  "board_id": "string",
  "column_mapping": {
    "status": "status_column_id",
    "assignee": "person_column_id",
    "due_date": "date_column_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "created_items": [
    {
      "task_id": "uuid",
      "monday_item_id": "123456",
      "url": "https://..."
    }
  ],
  "errors": []
}
```

## Configuration

### Environment Variables

**Backend (.env):**
```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_TIMEOUT=60

# Monday.com Configuration
MONDAY_API_TOKEN=your_token_here
MONDAY_BOARD_ID=123456789
MONDAY_API_URL=https://api.monday.com/v2

# Application Settings
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=INFO
```

**Frontend (.env):**
```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Security Considerations

1. **API Token Protection**
   - Never expose Monday.com token to frontend
   - Store in backend environment only
   - Use secure token rotation

2. **CORS Configuration**
   - Whitelist specific origins
   - No wildcard (*) in production

3. **Input Validation**
   - Sanitize meeting notes input
   - Validate Ollama responses
   - Prevent injection attacks

4. **Rate Limiting**
   - Limit Ollama requests per user
   - Throttle Monday.com API calls

## Deployment Architecture

### Development
```
Frontend: http://localhost:5173 (Vite dev server)
Backend:  http://localhost:8000 (Uvicorn)
Ollama:   http://localhost:11434
```

### Production
```
Frontend: Static hosting (Vercel, Netlify, S3+CloudFront)
Backend:  Docker container (AWS ECS, GCP Cloud Run)
Ollama:   Self-hosted server or GPU instance
```

## Performance Optimization

1. **Frontend**
   - Code splitting by route
   - Lazy load MUI components
   - Debounce text input
   - Optimize re-renders

2. **Backend**
   - Async Ollama calls
   - Connection pooling
   - Response caching (if applicable)
   - Structured logging

3. **AI Processing**
   - Set max token limits
   - Implement timeouts
   - Fallback mechanisms
   - Model warm-up on startup

## Error Handling Strategy

### Frontend
- Network errors → Retry with exponential backoff
- Validation errors → Inline field errors
- AI extraction failures → Allow manual task entry

### Backend
- Ollama unavailable → Return 503 with retry-after
- Monday.com errors → Detailed error messages
- Malformed AI output → Fallback parsing

## Testing Strategy

### Frontend
- Unit tests: Jest + React Testing Library
- Integration tests: Cypress
- Component tests: Storybook

### Backend
- Unit tests: pytest
- Integration tests: TestClient (FastAPI)
- Mocked Ollama/Monday responses

## Monitoring & Observability

- Health check endpoint: `/health`
- Metrics: Request duration, error rates
- Logging: Structured JSON logs
- Ollama model performance tracking
