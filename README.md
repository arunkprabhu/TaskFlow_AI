# meetingtotask

> **AI-Powered Meeting Notes to Tasks Converter**
> 
> Automatically extract actionable tasks from meeting notes using local AI (Ollama) and push them directly to Monday.com boards.

![Architecture](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-green)
![AI](https://img.shields.io/badge/AI-Ollama%20(Local)-orange)
![Integration](https://img.shields.io/badge/Integration-Monday.com-red)

## 🎯 Features

- **🤖 Local AI Processing** - Uses Ollama (llama3/mistral) to extract tasks privately
- **📝 Smart Task Extraction** - Identifies action items, assignees, due dates, and priorities
- **✏️ Editable Preview** - Review and edit all tasks before pushing to Monday.com
- **🎨 Modern UI** - Clean Material-UI interface with real-time updates
- **🔒 Secure** - API tokens never exposed to frontend, local AI processing
- **⚡ Fast Setup** - Automated setup script gets you running in minutes

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   React     │─────▶│   FastAPI    │─────▶│   Ollama     │
│  Frontend   │      │   Backend    │      │ (Local LLM)  │
│ TypeScript  │◀─────│   Python     │      │   llama3     │
└─────────────┘      └──────┬───────┘      └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Monday.com  │
                     │   GraphQL    │
                     └──────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design.

## 📋 Prerequisites

- **Python 3.11+** - Backend runtime
- **Node.js 18+** - Frontend development
- **Ollama** - Local LLM runtime ([Install](https://ollama.ai))
- **Monday.com Account** - Task management platform
- **Git** - Version control

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone or navigate to the project
cd /tmp/meetingtotask

# Run setup script
chmod +x setup.sh
./setup.sh

# Edit configuration
nano backend/.env  # Add your Monday.com API token

# Start all services
chmod +x start.sh
./start.sh
```

### Option 2: Docker

```bash
# Set environment variables
export MONDAY_API_TOKEN=your_token_here
export MONDAY_BOARD_ID=your_board_id

# Start all services
docker-compose up

# Pull Ollama model (first time only)
docker exec -it meetingtotask-ollama ollama pull llama3
```

### Option 3: Manual Setup

#### 1️⃣ Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Add your Monday.com API token

# Start backend
uvicorn app.main:app --reload
```

Backend runs on: http://localhost:8000

#### 2️⃣ Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Frontend runs on: http://localhost:5173

#### 3️⃣ Setup Ollama

```bash
# Install Ollama from https://ollama.ai
# Or use Docker:
docker run -d -p 11434:11434 ollama/ollama

# Pull llama3 model (recommended)
ollama pull llama3

# Or use mistral
ollama pull mistral

# Start Ollama server
ollama serve
```

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3  # or mistral
OLLAMA_TIMEOUT=60

# Monday.com Configuration
MONDAY_API_TOKEN=eyJhbGc...  # Your API token
MONDAY_BOARD_ID=123456789    # Default board ID
MONDAY_API_URL=https://api.monday.com/v2

# Application Settings
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=INFO
ENVIRONMENT=development
```

### Getting Monday.com Credentials

1. **API Token:**
   - Go to Monday.com → Avatar (top right)
   - Developer → API
   - Copy your API token (v2)

2. **Board ID:**
   - Open your Monday.com board
   - Check URL: `https://yourcompany.monday.com/boards/123456789`
   - The number at the end is your board ID

## 📖 Usage Guide

### 1. Access the Application

Open http://localhost:5173 in your browser

### 2. Paste Meeting Notes

Example meeting notes format:

```
Team Meeting - Sprint Planning
Date: April 22, 2026

Attendees: @sarah, @john, @mike

Discussion:
- Reviewed last sprint performance
- Discussed Q2 roadmap

Action Items:
- TODO: @sarah will update documentation by Friday
- Action: @john needs to fix authentication bug (URGENT)
- [ ] @mike should review the PR by tomorrow
- Schedule client demo next week
- Update database schema by 2026-04-30
```

### 3. Extract Tasks

Click **"Extract Tasks"** button. The AI will:
- Identify actionable items
- Extract assignees (e.g., @sarah → sarah)
- Infer due dates (e.g., "by Friday" → date)
- Detect priorities (URGENT → High)
- Calculate confidence scores

### 4. Review & Edit

Tasks appear in an editable table where you can:
- ✏️ Edit titles and descriptions
- 👤 Assign or change owners
- 📅 Set or update due dates
- 🎯 Adjust priorities (High/Medium/Low)

### 5. Push to Monday.com

Click **"Push to Monday.com"**, enter your board ID, and tasks are created!

## 📡 API Endpoints

### POST `/api/extract-tasks`
Extract tasks from meeting notes

**Request:**
```json
{
  "meeting_notes": "TODO: @john fix bug by Friday",
  "options": {
    "confidence_threshold": 0.5
  }
}
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "fix bug",
      "owner": "john",
      "due_date": "2026-04-26",
      "priority": "Medium",
      "confidence": 0.85
    }
  ],
  "metadata": {
    "model_used": "llama3",
    "processing_time_ms": 1234
  }
}
```

### POST `/api/push-to-monday`
Push tasks to Monday.com board

### GET `/api/health`
Check system health status

**Full API Documentation:** http://localhost:8000/docs

## 🧪 Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate
pytest
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Manual Testing

```bash
# Test Ollama connection
curl http://localhost:11434/api/tags

# Test backend health
curl http://localhost:8000/api/health

# Test task extraction
curl -X POST http://localhost:8000/api/extract-tasks \
  -H "Content-Type: application/json" \
  -d '{"meeting_notes": "TODO: Test task"}'
```

## 🐛 Troubleshooting

### Ollama Not Found
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Pull model if missing
ollama pull llama3
```

### Backend Errors
```bash
# Check logs
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --log-level debug

# Common issues:
# 1. MONDAY_API_TOKEN not set → Edit backend/.env
# 2. Ollama not running → Start with `ollama serve`
# 3. Port 8000 in use → Change port or kill process
```

### Frontend Not Loading
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev

# Check backend connection
# Edit frontend/.env and verify VITE_API_BASE_URL
```

### Monday.com Integration Issues
- ✅ Verify API token is valid (check Monday.com → Developers)
- ✅ Ensure board ID is correct
- ✅ Check token has write permissions
- ✅ Verify board is not archived

## 📁 Project Structure

```
meetingtotask/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app entry
│   │   ├── config.py       # Configuration
│   │   ├── api/routes/     # API endpoints
│   │   ├── services/       # Business logic
│   │   │   ├── ollama_client.py      # Ollama integration
│   │   │   ├── monday_client.py      # Monday.com API
│   │   │   └── task_processor.py     # Task validation
│   │   ├── models/         # Pydantic models
│   │   └── prompts/        # AI prompts
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml     # Docker orchestration
├── setup.sh              # Automated setup
├── start.sh              # Quick start script
├── ARCHITECTURE.md       # Technical documentation
└── README.md             # This file
```

## 🔒 Security Best Practices

1. **Never commit .env files** - Use .env.example templates
2. **Rotate API tokens regularly** - Monday.com security settings
3. **Use HTTPS in production** - Configure SSL/TLS
4. **Limit CORS origins** - Whitelist specific domains
5. **Validate all inputs** - Sanitize meeting notes
6. **Keep dependencies updated** - `npm audit` and `pip-audit`

## 🚢 Production Deployment

### Frontend (Static Hosting)
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel, Netlify, or S3
```

### Backend (Docker)
```bash
docker build -t meetingtotask-backend ./backend
docker run -p 8000:8000 --env-file backend/.env meetingtotask-backend
```

### Ollama (GPU Server)
- Deploy on dedicated GPU instance
- Configure backend OLLAMA_BASE_URL to point to server

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- [ ] Add authentication/multi-user support
- [ ] Support additional LLM models
- [ ] Integrate with Slack, Teams, etc.
- [ ] Add task templates and presets
- [ ] Implement task scheduling
- [ ] Add analytics dashboard

## 📄 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- **Ollama** - Local LLM runtime
- **FastAPI** - Modern Python web framework
- **React** - UI library
- **Material-UI** - Component library
- **Monday.com** - Task management platform

---

**Built with ❤️ for developers who want to automate meeting follow-ups**

Need help? Check [ARCHITECTURE.md](ARCHITECTURE.md) or open an issue.
