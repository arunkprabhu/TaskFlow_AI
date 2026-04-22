"""
Pydantic models for task data structures
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from enum import Enum
from uuid import uuid4


class PriorityLevel(str, Enum):
    """Task priority levels"""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class TaskBase(BaseModel):
    """Base task model"""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    owner: Optional[str] = Field(None, max_length=100)
    due_date: Optional[str] = None
    priority: PriorityLevel = Field(default=PriorityLevel.MEDIUM)


class ExtractedTask(TaskBase):
    """Task extracted by AI with confidence score"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    status: str = Field(default="To Do")


class TaskExtractionRequest(BaseModel):
    """Request model for task extraction"""
    meeting_notes: str = Field(..., min_length=10, max_length=50000)
    options: Optional[dict] = None


class TaskExtractionResponse(BaseModel):
    """Response model for task extraction"""
    tasks: List[ExtractedTask]
    metadata: dict


class MondayColumnMapping(BaseModel):
    """Column mapping for Monday.com board"""
    status: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None


class PushToMondayRequest(BaseModel):
    """Request model for pushing tasks to Monday.com"""
    tasks: List[ExtractedTask]
    board_id: Optional[str] = None
    api_token: Optional[str] = None
    column_mapping: Optional[MondayColumnMapping] = None


class MondayCreatedItem(BaseModel):
    """Created Monday.com item info"""
    task_id: str
    monday_item_id: str
    url: Optional[str] = None


class PushToMondayResponse(BaseModel):
    """Response model for Monday.com push"""
    success: bool
    created_items: List[MondayCreatedItem]
    errors: List[dict] = []
