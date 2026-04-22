"""
Ollama client for AI-powered task extraction from meeting notes
"""

import httpx
import json
import logging
import re
from typing import List, Optional
from app.config import settings
from app.models.task import ExtractedTask

logger = logging.getLogger(__name__)

# Prompt designed for small models - uses clear concrete example separated from input
EXTRACTION_PROMPT = """You extract tasks from meeting notes as JSON.

Example input: "Alice will fix the CSS bug by Friday. Bob should write tests."
Example output: {{"tasks":[{{"title":"Fix CSS bug","description":"CSS bug needs fixing","owner":"Alice","due_date":"2026-04-25","priority":"Medium","confidence":0.9}},{{"title":"Write tests","description":"Tests need to be written","owner":"Bob","due_date":null,"priority":"Medium","confidence":0.85}}]}}

Now extract tasks from this input:
{notes}

Output:"""


class OllamaClient:
    """Simple, reliable Ollama client for task extraction"""

    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        self.timeout = settings.ollama_timeout

    async def extract_tasks(self, meeting_notes: str) -> List[ExtractedTask]:
        """
        Extract tasks from meeting notes using Ollama.
        Sends notes to the AI model and parses the JSON response into tasks.
        """
        # Trim notes to reasonable length
        notes = meeting_notes.strip()
        if len(notes) > 2000:
            notes = notes[:2000]

        prompt = EXTRACTION_PROMPT.format(notes=notes)

        logger.info(f"Sending extraction request to Ollama ({self.model})...")
        raw_response = await self._call_ollama(prompt)
        logger.info(f"Received response from Ollama ({len(raw_response)} chars)")

        tasks_data = self._parse_json(raw_response)
        tasks = self._build_tasks(tasks_data)

        logger.info(f"Extracted {len(tasks)} tasks")
        return tasks

    async def _call_ollama(self, prompt: str) -> str:
        """Call the Ollama generate API and return the raw text response."""
        url = f"{self.base_url}/api/generate"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "keep_alive": "10m",
            "options": {
                "temperature": 0.1,
                "num_predict": 400,
                "num_ctx": 1024,
                "num_gpu": 1,
            },
        }

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout, connect=15.0)
        ) as client:
            try:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("response", "")
            except httpx.TimeoutException:
                raise Exception(
                    "Ollama is still loading the model. Please wait a moment and try again."
                )
            except httpx.HTTPError as e:
                raise Exception(f"Ollama connection error: {e}")

    def _parse_json(self, raw: str) -> list:
        """
        Parse the AI response into a list of task dicts.
        Handles common issues: markdown wrappers, truncated JSON, etc.
        """
        text = raw.strip()

        # 1. Try direct parse
        data = self._try_parse(text)
        if data is not None:
            return data.get("tasks", [])

        # 2. Strip markdown code fences
        cleaned = re.sub(r"^```(?:json)?\s*", "", text)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        data = self._try_parse(cleaned)
        if data is not None:
            return data.get("tasks", [])

        # 3. Extract JSON object with regex
        match = re.search(r"\{.*\"tasks\"\s*:\s*\[.*\].*\}", text, re.DOTALL)
        if match:
            data = self._try_parse(match.group(0))
            if data is not None:
                return data.get("tasks", [])

        # 4. Try to fix truncated JSON (add missing brackets)
        for suffix in ["}", "]}", '"]}'  , '"}]}']:
            data = self._try_parse(text + suffix)
            if data is not None and "tasks" in data:
                return data.get("tasks", [])

        logger.warning(f"Could not parse AI response. First 300 chars: {text[:300]}")
        return []

    def _try_parse(self, text: str) -> Optional[dict]:
        """Attempt to parse text as JSON, return None on failure."""
        try:
            result = json.loads(text)
            if isinstance(result, dict):
                return result
        except (json.JSONDecodeError, TypeError):
            pass
        return None

    def _build_tasks(self, tasks_data: list) -> List[ExtractedTask]:
        """Convert raw dicts into validated ExtractedTask objects."""
        valid_priorities = {"Critical", "High", "Medium", "Low"}
        # Filter out leaked prompt examples
        example_titles = {"fix css bug", "write tests"}
        tasks = []

        for item in tasks_data:
            try:
                # Ensure required field
                title = str(item.get("title", "")).strip()
                if not title:
                    continue

                # Skip prompt example leaks
                if title.lower() in example_titles:
                    continue

                # Sanitize priority
                priority = item.get("priority", "Medium")
                if priority not in valid_priorities:
                    priority = "Medium"

                # Sanitize confidence
                confidence = item.get("confidence", 0.8)
                try:
                    confidence = max(0.0, min(1.0, float(confidence)))
                except (ValueError, TypeError):
                    confidence = 0.8

                # Sanitize owner
                owner = item.get("owner")
                if owner and str(owner).lower() in ("null", "none", "n/a", ""):
                    owner = None

                # Sanitize due_date
                due_date = item.get("due_date")
                if due_date and str(due_date).lower() in ("null", "none", "n/a", ""):
                    due_date = None

                task = ExtractedTask(
                    title=title[:500],
                    description=(str(item.get("description", "")).strip() or None),
                    owner=str(owner).strip() if owner else None,
                    due_date=str(due_date).strip() if due_date else None,
                    priority=priority,
                    confidence=confidence,
                )
                tasks.append(task)
            except Exception as e:
                logger.warning(f"Skipping invalid task item: {e}")

        return tasks

    async def health_check(self) -> bool:
        """Check if Ollama is available."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False
