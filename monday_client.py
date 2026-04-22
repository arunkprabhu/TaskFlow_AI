"""
Monday.com API Client
Handles communication with Monday.com API
"""

import os
import requests
from typing import List, Dict


class MondayClient:
    """Client for Monday.com API"""
    
    def __init__(self):
        self.api_key = os.getenv('MONDAY_API_KEY')
        if not self.api_key:
            raise ValueError("MONDAY_API_KEY not set in environment")
        
        self.api_url = "https://api.monday.com/v2"
        self.headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
    
    def create_tasks(self, board_id: str, tasks: List[Dict]) -> List[Dict]:
        """
        Create tasks in a Monday.com board
        
        Args:
            board_id: Monday.com board ID
            tasks: List of task dictionaries
            
        Returns:
            List of created task responses
        """
        created_tasks = []
        
        for task in tasks:
            item = self.create_item(
                board_id=board_id,
                item_name=task['title'],
                column_values=self._build_column_values(task)
            )
            created_tasks.append(item)
        
        return created_tasks
    
    def create_item(self, board_id: str, item_name: str, column_values: Dict = None) -> Dict:
        """Create a single item in Monday.com board"""
        query = '''
        mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON) {
            create_item (
                board_id: $boardId,
                item_name: $itemName,
                column_values: $columnValues
            ) {
                id
                name
            }
        }
        '''
        
        variables = {
            'boardId': board_id,
            'itemName': item_name,
            'columnValues': column_values or {}
        }
        
        response = requests.post(
            self.api_url,
            json={'query': query, 'variables': variables},
            headers=self.headers
        )
        
        if response.status_code != 200:
            raise Exception(f"Monday.com API error: {response.text}")
        
        data = response.json()
        if 'errors' in data:
            raise Exception(f"Monday.com API error: {data['errors']}")
        
        return data['data']['create_item']
    
    def get_board_columns(self, board_id: str) -> List[Dict]:
        """Get columns for a board"""
        query = '''
        query ($boardId: ID!) {
            boards (ids: [$boardId]) {
                columns {
                    id
                    title
                    type
                }
            }
        }
        '''
        
        variables = {'boardId': board_id}
        
        response = requests.post(
            self.api_url,
            json={'query': query, 'variables': variables},
            headers=self.headers
        )
        
        if response.status_code != 200:
            raise Exception(f"Monday.com API error: {response.text}")
        
        data = response.json()
        return data['data']['boards'][0]['columns']
    
    def _build_column_values(self, task: Dict) -> str:
        """Build column values JSON for task"""
        import json
        
        column_values = {}
        
        # Add assignee if present
        if task.get('assignee'):
            column_values['person'] = {'personsAndTeams': [{'id': task['assignee']}]}
        
        # Add due date if present
        if task.get('due_date'):
            column_values['date'] = {'date': task['due_date']}
        
        # Add priority if present
        if task.get('priority'):
            column_values['status'] = {'label': task['priority']}
        
        return json.dumps(column_values) if column_values else None
