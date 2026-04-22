# Supported Note Formats

The improved task extraction system can now handle **ANY** note format! Here are examples of all supported formats:

## 📝 Format Types

### 1. Plain Text (`format_plain_text.txt`)
Simple paragraphs with no special formatting. Tasks described in natural language.
- ✅ Extracts action items from sentences
- ✅ Identifies owners from mentions
- ✅ Captures full context and descriptions
- ✅ Detects urgency and deadlines

### 2. Bullet Points (`format_bullet_points.txt`)
Traditional bullet lists with `•` or `-` markers.
- ✅ Processes completed vs pending items
- ✅ Extracts details from sub-bullets
- ✅ Identifies assignees in parentheses
- ✅ Recognizes priority levels

### 3. Email Style (`format_email_style.txt`)
Email-like format with headers and body text.
- ✅ Parses multi-paragraph descriptions
- ✅ Detects urgent/priority keywords
- ✅ Extracts action items from prose
- ✅ Handles formal business language

### 4. Checkboxes (`format_checkboxes.txt`)
Todo lists with `[ ]` unchecked and `[x]` checked items.
- ✅ Focuses on unchecked items
- ✅ Ignores completed `[x]` tasks
- ✅ Preserves detailed requirements
- ✅ Groups by sections/categories

### 5. Chat Transcript (`format_chat_transcript.txt`)
Slack/Teams style conversation logs with @mentions.
- ✅ Extracts commitments from chat
- ✅ Identifies @mentioned owners
- ✅ Detects action items in replies
- ✅ Handles informal language

### 6. Structured Format (`format_structured.txt`)
Formalized structure with labels and metadata.
- ✅ Parses priority tags (CRITICAL, HIGH, etc.)
- ✅ Extracts pre-defined fields
- ✅ Maintains structured information
- ✅ Handles multi-line descriptions

### 7. Mixed Format (`format_mixed.txt`)
Combination of paragraphs, lists, and numbered items.
- ✅ Intelligently parses mixed content
- ✅ Preserves context across formats
- ✅ Handles nested information
- ✅ Adapts to varying styles

## 🎯 What Gets Extracted

From ALL formats, the system extracts:

| Field | Description | Example |
|-------|-------------|---------|
| **Title** | Short action-based summary | "Fix payment gateway integration" |
| **Description** | Full context, details, requirements | "Affecting premium users and causing auth failures..." |
| **Owner** | Person assigned (from @mentions or names) | "Sarah", "@mike", null |
| **Due Date** | Deadline in YYYY-MM-DD format | "2026-04-25" |
| **Priority** | Critical, High, Medium, or Low | Based on urgency keywords |
| **Confidence** | 0.6-1.0 based on clarity | Higher for explicit tasks |

## 🔍 Detection Patterns

The system looks for:

### Action Verbs
`create`, `fix`, `update`, `implement`, `review`, `test`, `deploy`, `write`, `send`, `schedule`, `contact`, `prepare`, `complete`, `investigate`, `research`

### Keywords
`TODO`, `ACTION`, `TASK`, `need to`, `should`, `must`, `will`, `have to`, `going to`, `assigned to`

### Priority Indicators
- **Critical**: urgent, ASAP, critical, blocker, emergency
- **High**: important, soon, high priority, this week
- **Medium**: normal, regular, standard (default)
- **Low**: nice to have, when possible, low priority

### Date Keywords
`by`, `due`, `before`, `deadline`, `today`, `tomorrow`, `Friday`, `next week`

### Assignment Patterns
- `@username will...`
- `John needs to...`
- `assigned to Sarah`
- `(Mike)`

## 💡 Best Practices

For best extraction results:

1. **Be Specific**: Include details about what needs to be done
2. **Add Context**: Explain why, what impact, or special requirements  
3. **Mention People**: Use names or @mentions for assignments
4. **Indicate Urgency**: Use words like urgent, critical, or ASAP
5. **Include Deadlines**: Mention dates, days of week, or timeframes

## 🚀 Try It Out!

Copy any of the example files and test the extraction:

```bash
# View an example
cat examples/format_plain_text.txt

# The frontend will automatically detect the format and extract tasks
# Just paste the content into the meeting notes textarea
```

All formats work equally well - use whatever format is most natural for your team!
