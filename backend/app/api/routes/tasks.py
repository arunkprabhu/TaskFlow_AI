"""
Task-related API routes
"""

from fastapi import APIRouter, HTTPException, status
from typing import Optional
import time
import logging
from app.models.task import (
    TaskExtractionRequest,
    TaskExtractionResponse,
    PushToMondayRequest,
    PushToMondayResponse,
)
from app.services.python_extractor import PythonTaskExtractor
from app.services.monday_client import MondayClient

router = APIRouter(prefix="/api", tags=["tasks"])
logger = logging.getLogger(__name__)


@router.post("/extract-tasks", response_model=TaskExtractionResponse)
async def extract_tasks(request: TaskExtractionRequest):
    """
    Extract tasks from meeting notes using instant Python NLP extractor.
    """
    start_time = time.time()

    try:
        extractor = PythonTaskExtractor()
        tasks = extractor.extract(request.meeting_notes)
        processing_time = int((time.time() - start_time) * 1000)

        return TaskExtractionResponse(
            tasks=tasks,
            metadata={
                "engine": "python-nlp",
                "processing_time_ms": processing_time,
                "total_tasks": len(tasks),
            },
        )

    except Exception as e:
        logger.error(f"Task extraction failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract tasks: {str(e)}",
        )


@router.post("/push-to-monday", response_model=PushToMondayResponse)
async def push_to_monday(request: PushToMondayRequest):
    """
    Push extracted tasks to Monday.com board
    
    Args:
        request: Tasks and Monday.com configuration (including API token)
        
    Returns:
        Created items information
    """
    try:
        if not request.tasks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No tasks provided"
            )
        
        # Check if API token is provided
        if not request.api_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Monday.com API token is required. Please connect your Monday.com account first."
            )
        
        # Initialize Monday client with provided API token
        monday = MondayClient(api_token=request.api_token)
        
        # Convert column mapping to dict if present
        column_mapping = None
        if request.column_mapping:
            column_mapping = request.column_mapping.model_dump(exclude_none=True)
        
        # Create tasks in Monday.com
        created_items = await monday.create_tasks(
            tasks=request.tasks,
            board_id=request.board_id,
            column_mapping=column_mapping
        )
        
        # Check for failures
        errors = []
        if len(created_items) < len(request.tasks):
            errors.append({
                "message": f"Only {len(created_items)} of {len(request.tasks)} tasks were created"
            })
        
        return PushToMondayResponse(
            success=len(created_items) > 0,
            created_items=created_items,
            errors=errors
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Monday.com push failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to push tasks to Monday.com: {str(e)}"
        )


@router.get("/board/{board_id}/columns")
async def get_board_columns(board_id: str):
    """
    Get column information for a Monday.com board
    
    Args:
        board_id: Monday.com board ID
        
    Returns:
        Board column details
    """
    try:
        monday = MondayClient()
        board_info = await monday.get_board_info(board_id)
        
        return {
            "board_id": board_info["id"],
            "board_name": board_info["name"],
            "columns": board_info["columns"]
        }
        
    except Exception as e:
        logger.error(f"Failed to get board columns: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get board information: {str(e)}"
        )
