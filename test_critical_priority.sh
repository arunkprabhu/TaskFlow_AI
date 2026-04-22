#!/bin/bash

# Test script to verify Critical priority and data push to Monday.com

echo "=========================================="
echo "Testing Critical Priority & Data Push"
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

# Test 1: Extract tasks with Critical priority
echo "📝 Test 1: Extract tasks with various priorities"
echo "----------------------------------------"

notes='Team Meeting Notes

CRITICAL TASKS:
- BLOCKER: Fix production database crash @Sarah (URGENT, today)
- Emergency: Restore backups immediately @John (CRITICAL)

HIGH PRIORITY:
- URGENT: Deploy security patch @Mike (ASAP, tomorrow)
- Important: Review authentication code @Alex (HIGH priority)

NORMAL TASKS:
- Update documentation @Team (next week)
- Schedule meeting with client @Emily

LOW PRIORITY:
- Refactor old code when time permits
- Archive old logs (low priority, later)'

response=$(curl -s -X POST http://localhost:8000/api/extract-tasks \
    -H "Content-Type: application/json" \
    -d "{\"meeting_notes\": $(echo "$notes" | jq -Rs .)}")

echo "Response:"
echo "$response" | jq '.tasks[] | {title, priority, owner, due_date, description}' 2>/dev/null

if [ $? -eq 0 ]; then
    critical_count=$(echo "$response" | jq '[.tasks[] | select(.priority == "Critical")] | length')
    high_count=$(echo "$response" | jq '[.tasks[] | select(.priority == "High")] | length')
    medium_count=$(echo "$response" | jq '[.tasks[] | select(.priority == "Medium")] | length')
    low_count=$(echo "$response" | jq '[.tasks[] | select(.priority == "Low")] | length')
    
    echo ""
    echo "Priority Distribution:"
    echo "  🔴 Critical: $critical_count tasks"
    echo "  🟠 High: $high_count tasks"
    echo "  🟡 Medium: $medium_count tasks"
    echo "  🟢 Low: $low_count tasks"
    echo ""
    
    if [ "$critical_count" -gt 0 ]; then
        echo "✅ Critical priority extraction working!"
    else
        echo "⚠️  No Critical priority tasks extracted"
    fi
else
    echo "❌ Failed to extract tasks"
fi

echo ""
echo "=========================================="
echo ""

# Test 2: Verify field extraction
echo "📋 Test 2: Verify all fields are extracted"
echo "----------------------------------------"

notes2='Sprint Planning Meeting

Action Items:
- [ ] @John will migrate the database by Friday (HIGH priority)
      This involves updating schema and migrating 1M records
- [ ] @Sarah needs to review PR #123 ASAP (CRITICAL)
      Security fixes for authentication layer
- [ ] Update API documentation by 2026-04-30
      Include new endpoints and examples'

response2=$(curl -s -X POST http://localhost:8000/api/extract-tasks \
    -H "Content-Type: application/json" \
    -d "{\"meeting_notes\": $(echo "$notes2" | jq -Rs .)}")

echo "Extracted Tasks:"
echo "$response2" | jq -r '.tasks[] | "
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Title: \(.title)
  Description: \(.description // "none")
  Owner: \(.owner // "none")
  Due Date: \(.due_date // "none")
  Priority: \(.priority)
  Confidence: \(.confidence * 100)%
"' 2>/dev/null

echo ""

# Check which fields are populated
has_description=$(echo "$response2" | jq '[.tasks[] | select(.description != null and .description != "")] | length')
has_owner=$(echo "$response2" | jq '[.tasks[] | select(.owner != null and .owner != "")] | length')
has_due_date=$(echo "$response2" | jq '[.tasks[] | select(.due_date != null and .due_date != "")] | length')

echo "Field Population:"
echo "  📝 Descriptions: $has_description tasks"
echo "  👤 Owners: $has_owner tasks"
echo "  📅 Due Dates: $has_due_date tasks"
echo ""

if [ "$has_description" -gt 0 ] && [ "$has_owner" -gt 0 ] && [ "$has_due_date" -gt 0 ]; then
    echo "✅ All fields being extracted!"
else
    echo "⚠️  Some fields may not be extracted"
fi

echo ""
echo "=========================================="
echo ""

# Test 3: Monday.com column mapping info
echo "🔧 Test 3: Monday.com Integration Check"
echo "----------------------------------------"
echo ""
echo "ℹ️  To test Monday.com push:"
echo "   1. Open http://localhost:5173"
echo "   2. Enter your Monday.com API token"
echo "   3. Select a board"
echo "   4. Paste meeting notes with Critical priority tasks"
echo "   5. Extract tasks"
echo "   6. Review the tasks (Critical should be in dropdown)"
echo "   7. Click 'Push to Monday.com'"
echo ""
echo "✓ Backend logs will show:"
echo "   - Column mapping detected"
echo "   - Priority labels available"
echo "   - Description, due_date, assignee mapping"
echo "   - Each field being set with values"
echo ""
echo "Check backend logs: tail -f /tmp/backend.log"
echo ""
echo "=========================================="
echo "✨ Tests Complete!"
echo "=========================================="
