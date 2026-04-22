#!/bin/bash
# Keep Ollama model warm to prevent loading delays

echo "Warming up Ollama model llama3.2:1b..."

# Send a minimal request to load and keep the model in memory
curl -s -X POST http://localhost:11434/api/generate \
  -d '{
    "model": "llama3.2:1b",
    "prompt": "test",
    "stream": false,
    "keep_alive": "10m",
    "options": {
      "num_predict": 1
    }
  }' > /dev/null

echo "✓ Model warmed up and will stay loaded for 10 minutes"
echo "  Subsequent extractions will be much faster!"
