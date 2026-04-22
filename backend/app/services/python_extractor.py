"""
Python AI Task Extractor - Fast, rule-based + NLP extraction engine.
No external LLM dependency. Extracts tasks instantly using pattern matching,
sentence analysis, and natural language processing.
"""

import re
import logging
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.task import ExtractedTask

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Pattern definitions
# ──────────────────────────────────────────────

# Action verbs that indicate a task
ACTION_VERBS = (
    r"fix|create|update|implement|review|test|deploy|write|send|schedule|"
    r"contact|prepare|complete|investigate|research|refactor|design|build|"
    r"set up|setup|configure|migrate|optimize|improve|add|remove|delete|"
    r"integrate|develop|debug|resolve|address|handle|check|verify|ensure|"
    r"finalize|submit|deliver|launch|release|publish|document|track|monitor|"
    r"upgrade|downgrade|install|uninstall|enable|disable|automate|assign|"
    r"prioritize|consolidate|move|close|link|log|present|prepare"
)

# Keywords that signal a task sentence (must be followed by actual content)
TASK_SIGNALS = (
    r"\b(?:TODO|ACTION ITEM|ACTION|TASK|URGENT|CRITICAL|ASAP|BLOCKER)\b[:\-]\s+"
)

# Line start prefix: handles "- ", "* ", "1. ", bullets, or sentence start
LINE_PREFIX = r"(?:^[\s\-\*•\d\.]*|\. )\s*"

# Patterns for "Person will/should/needs to do something"
PERSON_ACTION_PATTERN = re.compile(
    rf"{LINE_PREFIX}([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+"
    rf"(?:will|should|needs?\s+to|must|is\s+going\s+to|committed\s+to|has\s+to|"
    rf"can|could|shall|volunteered\s+to|agreed\s+to|is\s+assigned\s+to|"
    rf"is\s+responsible\s+for)\s+"
    rf"(.+?)(?:\.(?:\s|$)|$)",
    re.IGNORECASE | re.MULTILINE,
)

# "@person" mention pattern
MENTION_ACTION_PATTERN = re.compile(
    rf"@(\w+)\s+(?:will|should|needs?\s+to|must|can)?\s*({ACTION_VERBS})\s+(.+?)(?:\.|$)",
    re.IGNORECASE | re.MULTILINE,
)

# "We need to / Someone should" pattern
IMPERSONAL_PATTERN = re.compile(
    rf"{LINE_PREFIX}(?:we\s+(?:need|should|must|have)\s+(?:to\s+)?|"
    rf"someone\s+(?:should|needs?\s+to|must)\s+|"
    rf"the\s+team\s+(?:should|needs?\s+to|must)\s+)"
    rf"(.+?)(?:\.(?:\s|$)|$)",
    re.IGNORECASE | re.MULTILINE,
)

# Task signal keywords (TODO:, URGENT:, ACTION ITEM:) — non-greedy to stop at first period
SIGNAL_PATTERN = re.compile(
    rf"({TASK_SIGNALS})(.{{5,}}?)(?:\.|$)",
    re.IGNORECASE | re.MULTILINE,
)

# Checkbox pattern: [ ] or - [ ] or 7. [ ]
CHECKBOX_PATTERN = re.compile(
    r"^[\s\d\.\-\*]*\[\s*\]\s+(.+?)$",
    re.MULTILINE,
)

# Lines starting with action verbs (bullet/numbered list items)
ACTION_LINE_PATTERN = re.compile(
    rf"^[\s\-\*•]*({ACTION_VERBS})\s+(.+?)(?:\.|$)",
    re.IGNORECASE | re.MULTILINE,
)

# "asked/requested that" pattern
REQUEST_PATTERN = re.compile(
    rf"([A-Z][a-z]+)\s+(?:asked|requested|wants?|told|instructed)\s+"
    rf"(?:the\s+team\s+to|that|everyone\s+to|us\s+to)\s+(.+?)(?:\.|$)",
    re.IGNORECASE | re.MULTILINE,
)

# Owner label patterns: "Owner: Name", "Assigned to: Name", "Responsible: Name"
OWNER_LABEL_PATTERN = re.compile(
    r"(?:owner|assigned\s+to|assignee|responsible|handled\s+by)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)",
    re.IGNORECASE,
)

# "Owner: Name - Do something" or "Assigned to: Name: Do something"
LABELED_TASK_PATTERN = re.compile(
    r"(?:owner|assigned\s+to|assignee)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*[:\-]\s+(.{5,}?)(?:\.|$)",
    re.IGNORECASE | re.MULTILINE,
)

# ──────────────────────────────────────────────
# Date patterns
# ──────────────────────────────────────────────

DAY_MAP = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}

MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "jun": 6, "jul": 7, "aug": 8, "sep": 9,
    "oct": 10, "nov": 11, "dec": 12,
}

# Priority keywords
PRIORITY_MAP = {
    "Critical": [
        "urgent", "asap", "critical", "blocker", "emergency",
        "drop everything", "immediately", "right away",
    ],
    "High": [
        "important", "high priority", "prioritize", "soon",
        "this week", "end of day", "eod", "by tomorrow",
    ],
    "Low": [
        "low priority", "nice to have", "when possible",
        "eventually", "backlog", "someday",
    ],
}


class PythonTaskExtractor:
    """
    Fast Python-based AI task extractor.
    Uses NLP patterns, regex, and heuristics to extract tasks from any text.
    Runs instantly - no LLM dependency.
    """

    def extract(self, notes: str) -> List[ExtractedTask]:
        """
        Extract tasks from meeting notes.

        Args:
            notes: Raw meeting notes in any format

        Returns:
            List of ExtractedTask objects
        """
        if not notes or len(notes.strip()) < 10:
            return []

        text = self._clean_text(notes)
        raw_tasks: List[dict] = []

        # 1. Person + action verb sentences ("Tom will investigate...")
        raw_tasks.extend(self._extract_person_actions(text))

        # 2. Owner: / Assigned to: labeled tasks
        raw_tasks.extend(self._extract_labeled_tasks(text))

        # 3. @mention tasks ("@sarah fix the bug")
        raw_tasks.extend(self._extract_mention_actions(text))

        # 4. Impersonal tasks ("We need to...", "Someone should...")
        raw_tasks.extend(self._extract_impersonal(text))

        # 5. Signal keywords (TODO:, URGENT:, ACTION:)
        raw_tasks.extend(self._extract_signals(text))

        # 6. Checkboxes ([ ] task)
        raw_tasks.extend(self._extract_checkboxes(text))

        # 7. Request patterns ("Kevin asked the team to...")
        raw_tasks.extend(self._extract_requests(text))

        # 8. Lines starting with action verbs
        raw_tasks.extend(self._extract_action_lines(text))

        # Deduplicate
        tasks = self._deduplicate(raw_tasks)

        # Build ExtractedTask objects
        result = []
        for t in tasks:
            try:
                task = ExtractedTask(
                    title=t["title"][:500],
                    description=t.get("description"),
                    owner=t.get("owner"),
                    due_date=t.get("due_date"),
                    priority=t.get("priority", "Medium"),
                    confidence=t.get("confidence", 0.8),
                )
                result.append(task)
            except Exception as e:
                logger.warning(f"Skipping invalid task: {e}")

        logger.info(f"Python extractor found {len(result)} tasks")
        return result

    # ──────────────────────────────────────────
    # Extraction methods
    # ──────────────────────────────────────────

    # Words that are not valid owners
    INVALID_OWNERS = {
        "we", "the", "this", "that", "it", "they", "there",
        "our", "my", "your", "all", "everyone", "anyone", "someone",
        "meeting", "team", "group", "discussion", "project",
        "action", "item", "task", "note", "agenda",
        # Common false-positive words that look like names
        "monday", "tuesday", "wednesday", "thursday", "friday",
        "saturday", "sunday", "january", "february", "march",
        "april", "june", "july", "august", "september",
        "october", "november", "december",
    }

    def _paragraph_context(self, text: str, end_pos: int, chars: int = 250) -> str:
        """Return text from end_pos up to chars characters but stop at a blank line."""
        window = text[end_pos:end_pos + chars]
        # Stop at double newline (paragraph break)
        stop = re.search(r"\n\s*\n", window)
        if stop:
            window = window[:stop.start()]
        return window

    def _extract_person_actions(self, text: str) -> List[dict]:
        """Extract: 'Person will/should/needs to do something'"""
        tasks = []
        for match in PERSON_ACTION_PATTERN.finditer(text):
            owner = match.group(1).strip()
            action = match.group(2).strip()
            if len(action) < 5:
                continue
            if owner.lower() in self.INVALID_OWNERS:
                owner = None

            # Search matched sentence + next sentences within same paragraph
            context = match.group(0) + self._paragraph_context(text, match.end())
            due = self._extract_date(context)
            priority = self._detect_priority(context)
            title = self._make_title(action)

            tasks.append({
                "title": title,
                "description": action,
                "owner": owner,
                "due_date": due,
                "priority": priority,
                "confidence": 0.9,
            })
        return tasks

    def _extract_labeled_tasks(self, text: str) -> List[dict]:
        """Extract: 'Owner: Name - Do something by date'"""
        tasks = []
        for match in LABELED_TASK_PATTERN.finditer(text):
            owner = match.group(1).strip()
            action = match.group(2).strip()
            if len(action) < 5:
                continue
            if owner.lower() in self.INVALID_OWNERS:
                owner = None
            tasks.append({
                "title": self._make_title(action),
                "description": action,
                "owner": owner,
                "due_date": self._extract_date(action),
                "priority": self._detect_priority(action),
                "confidence": 0.92,
            })
        return tasks

    def _extract_mention_actions(self, text: str) -> List[dict]:
        """Extract: '@person verb something'"""
        tasks = []
        for match in MENTION_ACTION_PATTERN.finditer(text):
            owner = match.group(1).strip()
            verb = match.group(2).strip()
            obj = match.group(3).strip()
            action = f"{verb} {obj}"

            tasks.append({
                "title": self._make_title(action),
                "description": action,
                "owner": owner,
                "due_date": self._extract_date(action),
                "priority": self._detect_priority(action),
                "confidence": 0.9,
            })
        return tasks

    def _extract_impersonal(self, text: str) -> List[dict]:
        """Extract: 'We need to...', 'Someone should...'"""
        tasks = []
        for match in IMPERSONAL_PATTERN.finditer(text):
            action = match.group(1).strip()
            if len(action) < 5:
                continue

            # Search action + rest of paragraph for dates
            context = action + " " + self._paragraph_context(text, match.end())

            tasks.append({
                "title": self._make_title(action),
                "description": action,
                "owner": None,
                "due_date": self._extract_date(context),
                "priority": self._detect_priority(context),
                "confidence": 0.75,
            })
        return tasks

    def _extract_signals(self, text: str) -> List[dict]:
        """Extract: 'TODO: ...', 'URGENT: ...', 'ACTION ITEM: ...'"""
        tasks = []
        for match in SIGNAL_PATTERN.finditer(text):
            signal_prefix = match.group(1).strip().upper().rstrip(":-")
            action = match.group(2).strip()
            if len(action) < 5:
                continue

            priority = "Medium"
            if any(kw in signal_prefix for kw in ("URGENT", "CRITICAL", "BLOCKER", "ASAP")):
                priority = "Critical"

            tasks.append({
                "title": self._make_title(action),
                "description": action,
                "owner": self._extract_owner(action),
                "due_date": self._extract_date(action),
                "priority": priority,
                "confidence": 0.95,
            })
        return tasks

    def _extract_checkboxes(self, text: str) -> List[dict]:
        """Extract: '[ ] task description'"""
        tasks = []
        for match in CHECKBOX_PATTERN.finditer(text):
            action = match.group(1).strip()
            if len(action) < 5:
                continue

            tasks.append({
                "title": self._make_title(action),
                "description": action,
                "owner": self._extract_owner(action),
                "due_date": self._extract_date(action),
                "priority": self._detect_priority(action),
                "confidence": 0.85,
            })
        return tasks

    def _extract_requests(self, text: str) -> List[dict]:
        """Extract: 'Kevin asked the team to...'"""
        tasks = []
        for match in REQUEST_PATTERN.finditer(text):
            requester = match.group(1).strip()
            action = match.group(2).strip()
            if len(action) < 5:
                continue

            tasks.append({
                "title": self._make_title(action),
                "description": f"{requester} requested: {action}",
                "owner": None,
                "due_date": self._extract_date(action),
                "priority": self._detect_priority(action),
                "confidence": 0.8,
            })
        return tasks

    def _extract_action_lines(self, text: str) -> List[dict]:
        """Extract lines starting with action verbs (bullet points, list items)"""
        tasks = []
        for match in ACTION_LINE_PATTERN.finditer(text):
            verb = match.group(1).strip()
            rest = match.group(2).strip()
            action = f"{verb} {rest}"
            if len(action) < 8:
                continue

            tasks.append({
                "title": self._make_title(action),
                "description": action,
                "owner": self._extract_owner(action),
                "due_date": self._extract_date(action),
                "priority": self._detect_priority(action),
                "confidence": 0.7,
            })
        return tasks

    # ──────────────────────────────────────────
    # Helper methods
    # ──────────────────────────────────────────

    def _clean_text(self, text: str) -> str:
        """Clean and normalize input text."""
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"<[^>]+>", "", text)  # Remove HTML
        text = re.sub(r"\[x\]|\[X\]|\[✓\]|\[✔\]", "[x]", text)  # Normalize checked
        text = re.sub(r"\[\s*\]", "[ ]", text)  # Normalize unchecked
        # Normalize bullet points
        text = re.sub(r"^[\s\t]*[•●○◦⚫⚪]\s*", "- ", text, flags=re.MULTILINE)
        return text.strip()

    def _make_title(self, action: str) -> str:
        """Create a clean short title from an action description."""
        title = action.strip()
        # Remove leading @ symbol
        title = re.sub(r"^@", "", title)
        # Remove leading conjunctions
        title = re.sub(r"^(?:and\s+|also\s+|then\s+)", "", title, flags=re.IGNORECASE)
        # Remove ordinal suffixes that leak into title (e.g. "meetingth" from "May 5th")
        title = re.sub(r"(?<=\d)(st|nd|rd|th)\b", "", title, flags=re.IGNORECASE)
        # Remove date phrases from title
        title = re.sub(
            r"\s*(?:by|before|due|until|deadline[:\s]*|no later than)\s+"
            r"(?:end of (?:day|week)|eod|eow|tomorrow|next\s+\w+|this\s+\w+|\w+day|"
            r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d+|\d+\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|"
            r"\d{4}[-/]\d{2}[-/]\d{2}|\d{1,2}/\d{1,2}/\d{4})\s*",
            "",
            title,
            flags=re.IGNORECASE,
        )
        # Remove parenthetical notes
        title = re.sub(r"\s*\([^)]*\)\s*", " ", title)
        # Capitalize first letter
        title = title.strip()
        if title:
            title = title[0].upper() + title[1:]
        # Limit length
        if len(title) > 80:
            title = title[:77] + "..."
        return title

    def _extract_owner(self, text: str) -> Optional[str]:
        """Extract person name from various owner patterns in text."""
        # @mention
        m = re.search(r"@(\w+)", text)
        if m:
            name = m.group(1)
            if name.lower() not in self.INVALID_OWNERS:
                return name

        # Label-style: "Owner: Name", "Assigned to: Name", "Responsible: Name"
        m = OWNER_LABEL_PATTERN.search(text)
        if m:
            name = m.group(1).strip()
            if name.lower() not in self.INVALID_OWNERS:
                return name

        # "assigned to Name" (inline)
        m = re.search(r"assigned\s+to\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)", text)
        if m:
            name = m.group(1)
            if name.lower() not in self.INVALID_OWNERS:
                return name

        # Parenthetical owner: (Kevin), (assigned to Kevin)
        m = re.search(r"\((?:assigned\s+to\s+)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\)", text)
        if m:
            name = m.group(1)
            if name.lower() not in self.INVALID_OWNERS:
                return name

        # "Name is responsible / volunteered / is assigned"
        m = re.search(r"([A-Z][a-z]+)\s+(?:is\s+responsible|volunteered|is\s+assigned)", text)
        if m:
            name = m.group(1)
            if name.lower() not in self.INVALID_OWNERS:
                return name

        return None

    def _extract_date(self, text: str) -> Optional[str]:
        """Extract due date from text. Returns YYYY-MM-DD or None."""
        today = datetime.now()  # Always fresh
        text_lower = text.lower()

        # ISO date: YYYY-MM-DD or YYYY/MM/DD
        m = re.search(r"\b(\d{4}[-/]\d{2}[-/]\d{2})\b", text)
        if m:
            return m.group(1).replace("/", "-")

        # DD/MM/YYYY or MM/DD/YYYY (prefer DD/MM if day<=12 ambiguous, use MM/DD)
        m = re.search(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", text)
        if m:
            a, b, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
            try:
                return datetime(year, a, b).strftime("%Y-%m-%d")  # MM/DD/YYYY
            except ValueError:
                try:
                    return datetime(year, b, a).strftime("%Y-%m-%d")  # DD/MM/YYYY
                except ValueError:
                    pass

        # "by tomorrow" / "due tomorrow"
        if re.search(r"\b(by|due|before)?\s*tomorrow\b", text_lower):
            return (today + timedelta(days=1)).strftime("%Y-%m-%d")

        # "today" / "end of day" / "EOD"
        if re.search(r"\b(today|end\s+of\s+day|\beod\b)\b", text_lower):
            return today.strftime("%Y-%m-%d")

        # "end of week" / "EOW" → Friday of current week
        if re.search(r"\b(end\s+of\s+(?:this\s+)?week|\beow\b)\b", text_lower):
            days_to_friday = (4 - today.weekday()) % 7 or 7
            return (today + timedelta(days=days_to_friday)).strftime("%Y-%m-%d")

        # "within N days"
        m = re.search(r"within\s+(\d+)\s+days?", text_lower)
        if m:
            return (today + timedelta(days=int(m.group(1)))).strftime("%Y-%m-%d")

        # "in N days"
        m = re.search(r"in\s+(\d+)\s+days?", text_lower)
        if m:
            return (today + timedelta(days=int(m.group(1)))).strftime("%Y-%m-%d")

        # "next week"
        if re.search(r"\bnext\s+week\b", text_lower):
            return (today + timedelta(days=7)).strftime("%Y-%m-%d")

        # Day of week: "by Friday", "next Tuesday", "this Wednesday"
        # Search with "next" prefix first (next Monday = always future)
        for day_name, day_num in DAY_MAP.items():
            if re.search(rf"\bnext\s+{day_name}\b", text_lower):
                days_ahead = (day_num - today.weekday() + 7) % 7
                if days_ahead == 0:
                    days_ahead = 7
                return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

        for day_name, day_num in DAY_MAP.items():
            if re.search(rf"\b(?:by|this|on)?\s*{day_name}\b", text_lower):
                days_ahead = (day_num - today.weekday() + 7) % 7
                if days_ahead == 0:
                    days_ahead = 7  # same day next week
                return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

        # "April 30", "30th April", "April 30th"
        for month_name, month_num in MONTH_MAP.items():
            # "Month DD" or "Month DDth"
            m = re.search(rf"\b{month_name}\s+(\d{{1,2}})(?:st|nd|rd|th)?\b", text_lower)
            if not m:
                # "DD Month" or "DDth Month"
                m = re.search(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+{month_name}\b", text_lower)
            if m:
                day = int(m.group(1))
                year = today.year
                try:
                    d = datetime(year, month_num, day)
                    if d.date() < today.date():
                        d = datetime(year + 1, month_num, day)
                    return d.strftime("%Y-%m-%d")
                except ValueError:
                    pass

        return None

    def _detect_priority(self, text: str) -> str:
        """Detect task priority from text keywords."""
        text_lower = text.lower()

        for priority, keywords in PRIORITY_MAP.items():
            for kw in keywords:
                if kw in text_lower:
                    return priority

        return "Medium"

    def _deduplicate(self, tasks: List[dict]) -> List[dict]:
        """Remove duplicate tasks based on title similarity."""
        seen_titles = set()
        unique = []

        for t in tasks:
            # Normalize title for comparison
            key = re.sub(r"[^a-z0-9]", "", t["title"].lower())
            if len(key) < 3:
                continue
            # Check for similar titles (first 30 chars)
            short_key = key[:30]
            if short_key not in seen_titles:
                seen_titles.add(short_key)
                unique.append(t)

        return unique
