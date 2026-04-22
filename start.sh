#!/bin/bash

# Quick start script for meetingtotask

set -e

echo "🚀 Starting meetingtotask..."
echo ""

# Function to check if process is running
check_service() {
    if nc -z localhost $1 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Check if Ollama is running
if ! check_service 11434; then
    echo "⚠️  Ollama is not running on port 11434"
    echo "   Start Ollama with: ollama serve"
    echo "   Or use Docker: docker run -d -p 11434:11434 ollama/ollama"
    exit 1
fi
echo "✅ Ollama is running"

# Start backend in background
echo "Starting backend..."
cd backend
source venv/bin/activate 2>/dev/null || true
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

if ! check_service 8000; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
echo "✅ Backend running on http://localhost:8000"

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

echo ""
echo "✅ meetingtotask is running!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C to kill background processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Wait for processes
wait
