"""
Monday.com GraphQL API client
"""

import httpx
import logging
from typing import List, Optional
from app.config import settings
from app.models.task import ExtractedTask, MondayCreatedItem

logger = logging.getLogger(__name__)


class MondayClient:
    """Client for interacting with Monday.com GraphQL API"""
    
    def __init__(self, api_token: Optional[str] = None):
        self.api_url = settings.monday_api_url
        self.api_token = (api_token or settings.monday_api_token)
        
        if not self.api_token:
            raise ValueError("Monday.com API token is required. Please configure your API token in the settings or connection modal.")
        
        # Strip whitespace from API token to prevent header errors
        self.api_token = self.api_token.strip()
        
        self.headers = {
            "Authorization": self.api_token,
            "Content-Type": "application/json"
        }
    
    async def create_tasks(
        self,
        tasks: List[ExtractedTask],
        board_id: Optional[str] = None,
        column_mapping: Optional[dict] = None
    ) -> List[MondayCreatedItem]:
        """
        Create tasks in Monday.com board.
        Auto-detects board columns for description, assignee, due date, priority, status.
        """
        board_id = board_id or settings.monday_board_id
        if not board_id:
            raise ValueError("Board ID is required")

        # Auto-detect column mapping from board schema
        auto_mapping = await self._detect_columns(board_id)
        # Merge: explicit column_mapping takes precedence over auto-detected ones
        effective_mapping = {**auto_mapping, **(column_mapping or {})}
        logger.info(f"Column mapping for board {board_id}: {effective_mapping}")

        created_items = []
        for task in tasks:
            try:
                item = await self._create_item(
                    board_id=board_id,
                    task=task,
                    column_mapping=effective_mapping
                )
                created_items.append(item)
                logger.info(f"Created Monday item {item.monday_item_id} for task {task.id}")

                # Post description as an item Update so it is always visible in Monday.com
                if task.description:
                    await self._create_item_update(item.monday_item_id, task.description)
            except Exception as e:
                logger.error(f"Failed to create task '{task.title}': {str(e)}")

        return created_items

    async def _detect_columns(self, board_id: str) -> dict:
        """
        Fetch board columns and automatically map them to our field types.
        Detects: text/description, date, status, priority, people columns.
        Also stores available labels for status/priority columns.
        """
        import json as _json
        try:
            board_info = await self.get_board_info(board_id)
            columns = board_info.get("columns", [])
        except Exception as e:
            logger.warning(f"Could not fetch board columns: {e}")
            return {}

        mapping = {}
        text_column_fallback = None  # any text-type column, used if no named match

        for col in columns:
            col_id = col["id"]
            col_title = col.get("title", "").lower()
            col_type = col.get("type", "").lower()

            # Parse available labels from settings_str (for status/color columns)
            available_labels: list[str] = []
            settings_str = col.get("settings_str", "")
            if settings_str:
                try:
                    settings = _json.loads(settings_str)
                    labels_dict = settings.get("labels", {})
                    available_labels = [v for v in labels_dict.values() if isinstance(v, str)]
                except Exception:
                    pass

            # Description / notes — match by name or long_text type
            if "description" not in mapping:
                if col_type in ("long_text", "long-text") or col_title in (
                    "description", "notes", "details", "summary", "note"
                ):
                    mapping["description"] = col_id
                    mapping["description_type"] = col_type

            # Track first plain text column as fallback
            if text_column_fallback is None and col_type == "text":
                text_column_fallback = col_id

            # Due date
            if "due_date" not in mapping:
                if col_type == "date" or col_title in ("due date", "due_date", "deadline", "target date", "date"):
                    mapping["due_date"] = col_id

            # Assignee / owner (people column)
            if "assignee" not in mapping:
                if col_type in ("multiple-person", "people") or col_title in ("assignee", "owner", "assigned to", "person", "people", "responsible"):
                    mapping["assignee"] = col_id

            # Priority column (status-type named Priority) — store labels too
            if "priority" not in mapping:
                if col_title in ("priority", "priorities"):
                    mapping["priority"] = col_id
                    if available_labels:
                        mapping["priority_labels"] = available_labels

            # Status column — store labels too
            if "status" not in mapping:
                if col_type in ("status", "color") and col_title in ("status", "state", "progress", "stage"):
                    mapping["status"] = col_id
                    if available_labels:
                        mapping["status_labels"] = available_labels

        # Fallback: use any text-type column for description if nothing matched by name
        if "description" not in mapping and text_column_fallback:
            mapping["description"] = text_column_fallback
            mapping["description_type"] = "text"
            logger.info(f"Using text column '{text_column_fallback}' as description fallback")

        logger.info(f"Auto-detected columns: { {k: v for k, v in mapping.items() if not k.endswith('_labels')} }")
        return mapping
    
    async def _create_item(
        self,
        board_id: str,
        task: ExtractedTask,
        column_mapping: Optional[dict] = None
    ) -> MondayCreatedItem:
        """Create a single item in Monday.com"""
        mutation = """
        mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON) {
            create_item (
                board_id: $boardId,
                item_name: $itemName,
                column_values: $columnValues
            ) {
                id
                name
                url
            }
        }
        """

        # Resolve people column assignee if needed
        assignee_id: Optional[int] = None
        if task.owner and column_mapping and column_mapping.get("assignee"):
            assignee_id = await self._find_user_id(task.owner)

        column_values = self._build_column_values(task, column_mapping, assignee_id)

        variables = {
            "boardId": board_id,
            "itemName": task.title,
            "columnValues": column_values,
        }

        response = await self._execute_query(mutation, variables)
        item_data = response["data"]["create_item"]

        return MondayCreatedItem(
            task_id=task.id,
            monday_item_id=item_data["id"],
            url=item_data.get("url"),
        )

    async def _create_item_update(self, item_id: str, body: str) -> None:
        """
        Post a text update (note) on a Monday.com item.
        This ensures the description is always visible in the item's Updates section,
        regardless of whether the board has a dedicated description column.
        """
        mutation = """
        mutation ($itemId: ID!, $body: String!) {
            create_update (item_id: $itemId, body: $body) {
                id
            }
        }
        """
        try:
            await self._execute_query(mutation, {"itemId": item_id, "body": body})
            logger.info(f"Posted description as update on item {item_id}")
        except Exception as e:
            logger.warning(f"Could not post description update on item {item_id}: {e}")

    async def _find_user_id(self, name: str) -> Optional[int]:
        """
        Look up a Monday.com user by name (first, last, or full name match).
        Returns the user ID or None if not found.
        """
        query = """
        query {
            users {
                id
                name
                email
            }
        }
        """
        try:
            response = await self._execute_query(query)
            users = response.get("data", {}).get("users", [])
            name_lower = name.lower()
            for user in users:
                uname = user.get("name", "").lower()
                # Match full name, first name, or last name
                if name_lower == uname or uname.startswith(name_lower) or uname.endswith(name_lower):
                    logger.info(f"Matched owner '{name}' to Monday user '{user['name']}' (id={user['id']})")
                    return int(user["id"])
        except Exception as e:
            logger.warning(f"User lookup failed for '{name}': {e}")
        return None

    def _build_column_values(
        self,
        task: ExtractedTask,
        column_mapping: Optional[dict] = None,
        assignee_id: Optional[int] = None,
    ) -> str:
        """
        Build column values JSON for Monday.com item.
        Maps: description, due_date, priority, status, assignee.
        """
        import json

        column_mapping = column_mapping or {}
        column_values: dict = {}

        # ── Description ──────────────────────────────
        if task.description and column_mapping.get("description"):
            col_id = column_mapping["description"]
            col_type = column_mapping.get("description_type", "text")
            # long_text columns need {"text": "..."}, plain text columns use a bare string
            if col_type in ("long_text", "long-text"):
                column_values[col_id] = {"text": task.description}
            else:
                column_values[col_id] = task.description

        # ── Due Date ─────────────────────────────────
        if task.due_date and column_mapping.get("due_date"):
            col_id = column_mapping["due_date"]
            column_values[col_id] = {"date": task.due_date}

        # ── Priority ─────────────────────────────────
        if column_mapping.get("priority"):
            col_id = column_mapping["priority"]
            our_priority = task.priority.value  # "Critical", "High", "Medium", "Low"
            available = column_mapping.get("priority_labels", [])

            # Try to find a matching label (case-insensitive)
            matched_label = None
            for label in available:
                if label.lower() == our_priority.lower():
                    matched_label = label
                    break

            # Fuzzy fallback: partial match
            if not matched_label:
                for label in available:
                    if our_priority.lower() in label.lower() or label.lower() in our_priority.lower():
                        matched_label = label
                        break

            if matched_label:
                column_values[col_id] = {"label": matched_label}
            elif available:
                # Map by severity rank: Critical/High→first, Low→last, Medium→middle
                rank_map = {"Critical": 0, "High": 0, "Medium": len(available) // 2, "Low": len(available) - 1}
                idx = rank_map.get(our_priority, 0)
                idx = min(idx, len(available) - 1)
                column_values[col_id] = {"label": available[idx]}
            else:
                # No label info — skip to avoid API errors
                logger.info(f"Skipping priority column — no label info available")

        # ── Status ───────────────────────────────────
        if column_mapping.get("status"):
            col_id = column_mapping["status"]
            # Use index 0 (first status = "Working on it" or equivalent)
            # This works regardless of what the board's status labels are called
            column_values[col_id] = {"index": 0}

        # ── Assignee (People column) ──────────────────
        if column_mapping.get("assignee"):
            col_id = column_mapping["assignee"]
            if assignee_id:
                column_values[col_id] = {
                    "personsAndTeams": [{"id": assignee_id, "kind": "person"}]
                }
            elif task.owner:
                # Fallback: store owner name as text if no person ID was resolved
                # (only works for text-type columns, skipped for people columns)
                logger.info(f"Could not resolve user ID for '{task.owner}', skipping people column")

        return json.dumps(column_values) if column_values else "{}"
    
    async def _execute_query(self, query: str, variables: Optional[dict] = None) -> dict:
        """
        Execute GraphQL query against Monday.com API
        
        Args:
            query: GraphQL query string
            variables: Query variables
            
        Returns:
            Response data
        """
        payload = {
            "query": query,
            "variables": variables or {}
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=self.headers
                )
                response.raise_for_status()
                
                data = response.json()
                
                # Check for GraphQL errors
                if "errors" in data:
                    error_messages = [err.get("message", str(err)) for err in data["errors"]]
                    raise Exception(f"Monday.com API errors: {', '.join(error_messages)}")
                
                return data
                
            except httpx.HTTPError as e:
                raise Exception(f"Monday.com HTTP error: {str(e)}")
    
    async def get_board_info(self, board_id: str) -> dict:
        """Get board information including columns with their types."""
        query = """
        query ($boardId: ID!) {
            boards (ids: [$boardId]) {
                id
                name
                columns {
                    id
                    title
                    type
                    settings_str
                }
            }
        }
        """
        
        variables = {"boardId": board_id}
        response = await self._execute_query(query, variables)
        
        boards = response["data"]["boards"]
        if not boards:
            raise Exception(f"Board {board_id} not found")
        
        return boards[0]
    
    async def health_check(self) -> bool:
        """
        Check if Monday.com API is accessible
        
        Returns:
            True if API is accessible
        """
        query = "query { me { id } }"
        
        try:
            await self._execute_query(query)
            return True
        except Exception as e:
            logger.error(f"Monday.com health check failed: {str(e)}")
            return False
