# Monday.com Integration Guide

## Overview

This guide covers Monday.com API setup, board configuration, and common integration patterns for meetingtotask.

## Getting Started

### 1. Create API Token

1. Log in to Monday.com
2. Click your avatar (top right)
3. Navigate to **Developers** → **API**
4. Click **Generate** or copy existing token (v2)
5. Save token securely - it won't be shown again

### 2. Find Your Board ID

**Method 1: From URL**
```
https://yourcompany.monday.com/boards/123456789
                                      ^^^^^^^^^^
                                      Board ID
```

**Method 2: Via API**
```bash
curl https://api.monday.com/v2 \
  -H "Authorization: YOUR_TOKEN" \
  -d '{"query": "{ boards { id name } }"}'
```

### 3. Configure Backend

Edit `backend/.env`:
```bash
MONDAY_API_TOKEN=eyJhbGciOiJIUzI1NiJ9...
MONDAY_BOARD_ID=123456789
```

## Board Setup

### Creating a Task Board

1. **Create Board:**
   - Go to Monday.com
   - Click **+** → **New board**
   - Choose "Board from template" → "Tasks"

2. **Configure Columns:**

   Recommended columns:
   - **Task** - Text (built-in)
   - **Status** - Status (e.g., "To Do", "In Progress", "Done")
   - **Owner** - Person
   - **Due Date** - Date
   - **Priority** - Status (High/Medium/Low)
   - **Description** - Long Text

3. **Get Column IDs:**

```bash
curl http://localhost:8000/api/board/YOUR_BOARD_ID/columns
```

Response:
```json
{
  "columns": [
    {"id": "status", "title": "Status", "type": "status"},
    {"id": "person", "title": "Owner", "type": "person"},
    {"id": "date4", "title": "Due Date", "type": "date"}
  ]
}
```

## Column Mapping

### Automatic Mapping (Default)

The backend automatically maps to common column types:
- `description` → First text column
- `owner` → First person column
- `due_date` → First date column
- `priority` → Status column with matching labels

### Custom Mapping

Pass `column_mapping` in push request:

```typescript
{
  "tasks": [...],
  "board_id": "123456789",
  "column_mapping": {
    "status": "status",
    "assignee": "person",
    "due_date": "date4"
  }
}
```

## GraphQL Examples

### Create Item

```graphql
mutation {
  create_item (
    board_id: 123456789,
    item_name: "Fix authentication bug"
  ) {
    id
    name
  }
}
```

### Create Item with Columns

```graphql
mutation {
  create_item (
    board_id: 123456789,
    item_name: "Update documentation",
    column_values: "{\"status\":\"To Do\",\"person\":{\"personsAndTeams\":[{\"id\":456}]},\"date4\":{\"date\":\"2026-04-30\"}}"
  ) {
    id
    name
    url
  }
}
```

### Get Board Columns

```graphql
query {
  boards (ids: [123456789]) {
    id
    name
    columns {
      id
      title
      type
    }
  }
}
```

### Get Current User

```graphql
query {
  me {
    id
    name
    email
  }
}
```

## Advanced Features

### Assign to Users

1. **Get User ID:**
```graphql
query {
  users {
    id
    name
    email
  }
}
```

2. **Assign in column_values:**
```json
{
  "person": {
    "personsAndTeams": [{"id": 12345, "kind": "person"}]
  }
}
```

### Set Status Labels

```json
{
  "status": {
    "label": "In Progress"
  }
}
```

Labels must match board configuration.

### Add Updates (Comments)

```graphql
mutation {
  create_update (
    item_id: 987654321,
    body: "Task created from meeting notes"
  ) {
    id
  }
}
```

### Link Items

```graphql
mutation {
  create_column_value (
    item_id: 123,
    column_id: "link",
    value: "{\"item_ids\":[456,789]}"
  ) {
    id
  }
}
```

## Rate Limits

Monday.com API limits:
- **Requests:** 500-1000 per minute (varies by plan)
- **Complexity:** Each query has complexity score

**Best Practices:**
1. Batch create requests when possible
2. Use webhooks instead of polling
3. Cache board/column metadata
4. Implement exponential backoff

**Backend Rate Limiting:**
```python
# In monday_client.py, add rate limiting
import time
from functools import wraps

def rate_limit(calls_per_minute=60):
    min_interval = 60.0 / calls_per_minute
    last_called = [0.0]
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            elapsed = time.time() - last_called[0]
            left_to_wait = min_interval - elapsed
            if left_to_wait > 0:
                await asyncio.sleep(left_to_wait)
            last_called[0] = time.time()
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

## Error Handling

### Common Errors

**InvalidUserIdException:**
- User ID doesn't exist in workspace
- Solution: Use text field for owner names instead

**ColumnValueException:**
- Invalid column value format
- Solution: Validate data before sending

**RateLimitExceededException:**
- Too many requests
- Solution: Implement backoff strategy

**ItemsLimitationException:**
- Board item limit reached
- Solution: Archive old items

### Backend Error Handling

See `backend/app/services/monday_client.py`:

```python
try:
    response = await self._execute_query(mutation, variables)
except Exception as e:
    if "rate_limit" in str(e).lower():
        # Implement retry logic
        await asyncio.sleep(60)
        return await self.create_item(...)
    else:
        logger.error(f"Monday.com error: {e}")
        raise
```

## Webhooks (Optional)

### Setup Webhook

1. Go to Board → Integrations
2. Create custom webhook
3. Configure endpoint: `https://your-domain.com/api/webhook/monday`

### Handle Webhook

```python
# backend/app/api/routes/webhooks.py
@router.post("/webhook/monday")
async def monday_webhook(payload: dict):
    event = payload.get("event")
    
    if event.get("type") == "create_pulse":
        # Task created in Monday
        item_id = event.get("pulseId")
        # Sync back to your system
    
    return {"status": "ok"}
```

## Testing

### Test Connection

```bash
curl http://localhost:8000/api/health/monday
```

### Test Create Item

```bash
curl -X POST http://localhost:8000/api/push-to-monday \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [{
      "id": "test-1",
      "title": "Test Task",
      "priority": "Medium",
      "confidence": 1.0
    }],
    "board_id": "YOUR_BOARD_ID"
  }'
```

## Security

1. **Token Storage:**
   - Never commit tokens to Git
   - Use environment variables
   - Rotate tokens regularly

2. **Token Permissions:**
   - Create tokens with minimal required scopes
   - Use separate tokens for dev/prod

3. **HTTPS Only:**
   - Always use HTTPS in production
   - Monday.com requires HTTPS for webhooks

## Resources

- Monday.com API Docs: https://developer.monday.com/api-reference/docs
- GraphQL Playground: https://yourcompany.monday.com/graphql-explorer
- Community: https://community.monday.com/
- Support: support@monday.com
