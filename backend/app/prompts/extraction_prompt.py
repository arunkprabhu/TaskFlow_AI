"""
AI prompt templates for task extraction
"""


TASK_EXTRACTION_PROMPT = """Extract tasks from notes. Return ONLY valid JSON.

Find: TODO, Action, @names, "will", "should", "must", [ ], urgent, ASAP, critical, blocker, fix, create, update

JSON format (no extra text):
{{"tasks":[{{"title":"Action","description":"Details","owner":null,"due_date":null,"priority":"Medium","confidence":0.8}}]}}

Rules:
- title: verb + object (e.g., "Fix bug")
- description: context from notes or null
- owner: name or null
- priority: Critical (blocker/emergency)|High (urgent/ASAP)|Medium (default)|Low (later/optional)
- due_date: YYYY-MM-DD or null (today=2026-04-22)
- confidence: 0.6-1.0

Notes:
{meeting_notes}

Return JSON only:"""


def get_extraction_prompt(meeting_notes: str) -> str:
    """
    Generate the task extraction prompt with meeting notes
    
    Args:
        meeting_notes: The meeting notes text
        
    Returns:
        Complete prompt string
    """
    return TASK_EXTRACTION_PROMPT.format(meeting_notes=meeting_notes)
