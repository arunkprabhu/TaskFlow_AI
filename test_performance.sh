#!/bin/bash

# Performance Test Script for Task Extraction
# Tests extraction speed with various formats

echo "=========================================="
echo "Task Extraction Performance Test"
echo "=========================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "❌ Backend is not running on port 8000"
    echo "Please start the backend first: ./start.sh"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Function to test extraction
test_extraction() {
    local format_name="$1"
    local notes="$2"
    
    echo "Testing: $format_name"
    echo "----------------------------------------"
    
    # Measure time
    start_time=$(date +%s.%N)
    
    # Call API
    response=$(curl -s -X POST http://localhost:8000/api/extract-tasks \
        -H "Content-Type: application/json" \
        -d "{\"meeting_notes\": $(echo "$notes" | jq -Rs .)}")
    
    end_time=$(date +%s.%N)
    elapsed=$(echo "$end_time - $start_time" | bc)
    
    # Extract task count
    task_count=$(echo "$response" | jq -r '.tasks | length')
    processing_time=$(echo "$response" | jq -r '.metadata.processing_time_ms')
    
    if [ "$task_count" != "null" ]; then
        echo "  ✓ Tasks extracted: $task_count"
        echo "  ✓ Server processing: ${processing_time}ms"
        echo "  ✓ Total API time: ${elapsed}s"
    else
        echo "  ✗ Error: $(echo "$response" | jq -r '.detail // "Unknown error"')"
    fi
    echo ""
}

# Test 1: Plain Text Format
echo "📄 Test 1: Plain Text"
notes1="Meeting discussed sprint planning. John will migrate database by Friday. Sarah needs to review PR #123 urgently. Mike must deploy tomorrow."
test_extraction "Plain Text" "$notes1"

# Test 2: Markdown with Checkboxes
echo "📝 Test 2: Markdown Format"
notes2="# Meeting Notes
## Action Items
- [ ] @John: Database migration (Friday)
- [ ] @Sarah: Review PR #123 (URGENT)
- [ ] @Mike: Deploy production (tomorrow)"
test_extraction "Markdown" "$notes2"

# Test 3: Bullet Points
echo "🔹 Test 3: Bullet Points"
notes3="Sprint Tasks:
• Database migration - @John (HIGH priority, due Friday)
• Code review PR #123 - @Sarah (URGENT)
• Production deployment - @Mike (tomorrow)"
test_extraction "Bullets" "$notes3"

# Test 4: Natural Language
echo "💬 Test 4: Natural Language"
notes4="During the standup, John mentioned he will complete the database migration by Friday. Sarah said she needs to review PR #123 as soon as possible. Mike committed to deploying to production tomorrow morning."
test_extraction "Natural Language" "$notes4"

# Test 5: Cache Test (Same as Test 1)
echo "💾 Test 5: Cache Test (Repeat of Test 1)"
test_extraction "Cached Request" "$notes1"

echo "=========================================="
echo "✨ Performance Test Complete!"
echo "=========================================="
echo ""
echo "Note: First extraction after server start may be slower"
echo "      due to model loading (30-60s). Subsequent runs"
echo "      should be much faster (3-7s)."
echo ""
echo "See PERFORMANCE.md for optimization details!"
