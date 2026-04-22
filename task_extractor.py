"""
Task Extraction Module
Extracts action items and tasks from meeting notes
"""

import re
from typing import List, Dict
from datetime import datetime, timedelta


class TaskExtractor:
    """Extract tasks from meeting notes using pattern matching"""
    
    def __init__(self):
        # Patterns for identifying action items
        self.action_patterns = [
            r'(?:TODO|To do|Action item):?\s*(.+)',
            r'(?:Action|Task|Follow[- ]up):?\s*(.+)',
            r'\[\s*\]\s*(.+)',  # Markdown checkboxes
            r'(?:^|\n)[-*]\s*(.+?)(?:will|should|needs? to|must)\s+(.+)',
            r'@(\w+)\s+(?:will|should|needs? to)\s+(.+)',
        ]
        
        # Patterns for due dates
        self.date_patterns = [
            r'(?:by|due|deadline)\s+(\d{4}-\d{2}-\d{2})',
            r'(?:by|due)\s+(next\s+\w+)',
            r'(?:by|due)\s+(tomorrow|today)',
            r'(?:by|due)\s+(\w+day)',  # Monday, Tuesday, etc.
        ]
    
    def extract_tasks(self, text: str) -> List[Dict]:
        """
        Extract tasks from meeting text
        
        Args:
            text: Meeting notes text
            
        Returns:
            List of task dictionaries
        """
        tasks = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Try to extract task
            task = self._extract_task_from_line(line)
            if task:
                tasks.append(task)
        
        # Remove duplicates
        unique_tasks = []
        seen_titles = set()
        for task in tasks:
            if task['title'] not in seen_titles:
                unique_tasks.append(task)
                seen_titles.add(task['title'])
        
        return unique_tasks
    
    def _extract_task_from_line(self, line: str) -> Dict:
        """Extract a single task from a line"""
        task = None
        
        for pattern in self.action_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                if len(match.groups()) == 1:
                    title = match.group(1).strip()
                else:
                    # Pattern with assignee
                    assignee = match.group(1)
                    title = match.group(2).strip()
                
                # Clean up the title
                title = re.sub(r'\s+', ' ', title)
                
                # Extract assignee if mentioned with @
                assignee = self._extract_assignee(line)
                
                # Extract due date
                due_date = self._extract_due_date(line)
                
                task = {
                    'title': title,
                    'description': '',
                    'assignee': assignee,
                    'due_date': due_date,
                    'priority': self._extract_priority(line)
                }
                break
        
        return task
    
    def _extract_assignee(self, text: str) -> str:
        """Extract assignee from text (e.g., @john)"""
        match = re.search(r'@(\w+)', text)
        return match.group(1) if match else None
    
    def _extract_due_date(self, text: str) -> str:
        """Extract due date from text"""
        for pattern in self.date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1).lower()
                
                # Convert relative dates to absolute
                if date_str == 'tomorrow':
                    return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
                elif date_str == 'today':
                    return datetime.now().strftime('%Y-%m-%d')
                elif 'next' in date_str:
                    return (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
                else:
                    return date_str
        
        return None
    
    def _extract_priority(self, text: str) -> str:
        """Extract priority from text"""
        text_lower = text.lower()
        if 'urgent' in text_lower or 'high priority' in text_lower or '!!!' in text:
            return 'High'
        elif 'low priority' in text_lower:
            return 'Low'
        return 'Medium'
