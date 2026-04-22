#!/bin/bash

# meetingtotask Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 meetingtotask Setup"
echo "======================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+"
    exit 1
fi
echo "✅ Python found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama not found. Please install from https://ollama.ai"
    echo "   Or use Docker: docker pull ollama/ollama"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Ollama found: $(ollama --version)"
fi

echo ""
echo "Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
echo "✅ Backend dependencies installed"

# Create .env file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Backend .env file created"
    echo "⚠️  Please edit backend/.env and add your Monday.com API token"
fi

cd ..

echo ""
echo "Setting up frontend..."
cd frontend

# Install Node dependencies
npm install
echo "✅ Frontend dependencies installed"

# Create .env file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Frontend .env file created"
fi

cd ..

echo ""
echo "Checking Ollama models..."
if command -v ollama &> /dev/null; then
    if ollama list | grep -q "llama3"; then
        echo "✅ llama3 model found"
    else
        echo "⚠️  llama3 model not found"
        read -p "Download llama3 model? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ollama pull llama3
            echo "✅ llama3 model downloaded"
        fi
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your Monday.com API token"
echo "2. Start Ollama: ollama serve (or use Docker)"
echo "3. Start backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "4. Start frontend: cd frontend && npm run dev"
echo "5. Open http://localhost:5173"
echo ""
echo "Or use Docker: docker-compose up"
