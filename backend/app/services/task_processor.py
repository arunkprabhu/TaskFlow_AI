"""
Task processing and validation service
"""

import logging
from typing import List
from datetime import datetime
from app.models.task import ExtractedTask

logger = logging.getLogger(__name__)


class TaskProcessor:
    """Process and validate extracted tasks"""
    
    @staticmethod
    def validate_tasks(tasks: List[ExtractedTask]) -> List[ExtractedTask]:
        """
        Validate and clean task data
        
        Args:
            tasks: List of extracted tasks
            
        Returns:
            List of validated tasks
        """
        validated_tasks = []
        
        for task in tasks:
            try:
                # Clean title
                task.title = task.title.strip()
                if len(task.title) == 0:
                    logger.warning("Skipping task with empty title")
                    continue
                
                # Clean description
                if task.description:
                    task.description = task.description.strip()
                
                # Clean owner
                if task.owner:
                    task.owner = task.owner.strip()
                
                # Validate due date format
                if task.due_date:
                    task.due_date = TaskProcessor._validate_date(task.due_date)
                
                # Ensure confidence is in range
                task.confidence = max(0.0, min(1.0, task.confidence))
                
                validated_tasks.append(task)
                
            except Exception as e:
                logger.error(f"Error validating task '{task.title}': {str(e)}")
                # Skip invalid tasks
        
        return validated_tasks
    
    @staticmethod
    def _validate_date(date_str: str) -> str:
        """
        Validate and normalize date string
        
        Args:
            date_str: Date string
            
        Returns:
            Normalized date string in YYYY-MM-DD format
        """
        try:
            # Try to parse date in various formats
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"]:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.strftime("%Y-%m-%d")
                except ValueError:
                    continue
            
            # If no format matched, return original
            logger.warning(f"Could not parse date '{date_str}', keeping as-is")
            return date_str
            
        except Exception:
            return date_str
    
    @staticmethod
    def filter_by_confidence(
        tasks: List[ExtractedTask],
        threshold: float = 0.5
    ) -> List[ExtractedTask]:
        """
        Filter tasks by confidence threshold
        
        Args:
            tasks: List of tasks
            threshold: Minimum confidence score (0.0-1.0)
            
        Returns:
            Filtered list of tasks
        """
        return [task for task in tasks if task.confidence >= threshold]
    
    @staticmethod
    def deduplicate_tasks(tasks: List[ExtractedTask]) -> List[ExtractedTask]:
        """
        Remove duplicate tasks based on title similarity
        
        Args:
            tasks: List of tasks
            
        Returns:
            Deduplicated list of tasks
        """
        seen_titles = set()
        unique_tasks = []
        
        for task in tasks:
            title_lower = task.title.lower().strip()
            if title_lower not in seen_titles:
                seen_titles.add(title_lower)
                unique_tasks.append(task)
            else:
                logger.debug(f"Skipping duplicate task: {task.title}")
        
        return unique_tasks
