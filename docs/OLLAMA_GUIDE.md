# Ollama Integration Guide

## Overview

meetingtotask uses Ollama to run LLMs locally for task extraction. This guide covers Ollama setup, model selection, and optimization.

## Installation

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
Download from https://ollama.ai/download

### Docker
```bash
docker pull ollama/ollama
docker run -d -p 11434:11434 --name ollama ollama/ollama
```

## Model Selection

### Recommended Models

#### llama3 (Default)
- **Size:** ~4.7GB
- **Speed:** Fast
- **Accuracy:** Excellent for task extraction
- **Install:** `ollama pull llama3`

#### mistral
- **Size:** ~4.1GB
- **Speed:** Very fast
- **Accuracy:** Good
- **Install:** `ollama pull mistral`

#### llama3:70b
- **Size:** ~40GB
- **Speed:** Slower (requires GPU)
- **Accuracy:** Best quality
- **Install:** `ollama pull llama3:70b`

### Changing Models

Edit `backend/.env`:
```bash
OLLAMA_MODEL=mistral  # or llama3, llama3:70b, etc.
```

## Performance Optimization

### GPU Acceleration

Ollama automatically uses GPU if available:
```bash
# Check GPU usage
nvidia-smi  # NVIDIA

# For AMD GPUs
rocm-smi
```

### CPU-Only Optimization

```bash
# Set thread count
export OLLAMA_NUM_THREADS=8

# Start Ollama
ollama serve
```

### Memory Management

```bash
# Limit memory usage (in GB)
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_MAX_VRAM=4
```

## API Usage

### Generate Endpoint

```bash
curl http://localhost:11434/api/generate \
  -d '{
    "model": "llama3",
    "prompt": "Extract tasks from: TODO: Fix bug",
    "stream": false
  }'
```

### Chat Endpoint

```bash
curl http://localhost:11434/api/chat \
  -d '{
    "model": "llama3",
    "messages": [
      {"role": "user", "content": "Extract tasks from meeting notes"}
    ]
  }'
```

## Prompt Engineering

### Task Extraction Prompt

See `backend/app/prompts/extraction_prompt.py` for the full prompt.

Key components:
1. **Clear instructions** - What to extract and ignore
2. **Output format** - Strict JSON schema
3. **Examples** - Good and bad examples
4. **Confidence scoring** - How certain the model is

### Improving Extraction Quality

**Increase context:**
```python
prompt = f"""
You are an expert at analyzing meeting notes.
Focus only on clear action items.

Meeting Notes:
{notes}
"""
```

**Adjust temperature:**
```python
{
  "temperature": 0.2,  # Lower = more consistent
  "top_p": 0.9
}
```

## Troubleshooting

### Ollama Not Starting

```bash
# Check if port is in use
lsof -i :11434

# Kill existing process
pkill ollama

# Start fresh
ollama serve
```

### Model Not Found

```bash
# List installed models
ollama list

# Pull required model
ollama pull llama3

# Remove unused models
ollama rm mistral
```

### Slow Performance

1. **Use smaller model:** Switch to `mistral`
2. **Enable GPU:** Ensure CUDA/ROCm drivers installed
3. **Reduce context:** Limit meeting notes length
4. **Increase timeout:** Edit `OLLAMA_TIMEOUT` in .env

### Memory Issues

```bash
# Monitor Ollama memory
ps aux | grep ollama

# Clear model cache
ollama stop
rm -rf ~/.ollama/models
ollama pull llama3
```

## Advanced Configuration

### Custom Model Files

Create custom `Modelfile`:

```dockerfile
FROM llama3

# Set parameters
PARAMETER temperature 0.1
PARAMETER top_p 0.9

# Set system prompt
SYSTEM You are a task extraction assistant.
```

Load custom model:
```bash
ollama create task-extractor -f ./Modelfile
```

Use in app:
```bash
OLLAMA_MODEL=task-extractor
```

### Running Multiple Models

```bash
# Keep multiple models loaded
export OLLAMA_MAX_LOADED_MODELS=2

# Use different models for different tasks
# Edit backend to select model based on note length
```

## Monitoring

### Health Check

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Get model info
curl http://localhost:11434/api/show -d '{"name": "llama3"}'
```

### Performance Metrics

```bash
# Time a request
time curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "test"
}'
```

### Logs

```bash
# View Ollama logs
journalctl -u ollama -f  # Linux systemd

# Docker logs
docker logs -f ollama
```

## Best Practices

1. **Pre-pull models** - Download before first use
2. **Use appropriate model** - Bigger isn't always better
3. **Set reasonable timeouts** - 30-60 seconds for most tasks
4. **Monitor memory** - Prevent OOM errors
5. **Keep Ollama updated** - `brew upgrade ollama`

## Resources

- Ollama Documentation: https://ollama.ai/docs
- Model Library: https://ollama.ai/library
- GitHub: https://github.com/ollama/ollama
