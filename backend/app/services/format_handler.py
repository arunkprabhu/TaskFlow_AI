"""
Format handler for various meeting notes input formats
"""

import re
from typing import Dict, List


class FormatHandler:
    """Handle and normalize various meeting notes formats"""
    
    @staticmethod
    def detect_format(text: str) -> str:
        """
        Detect the format of meeting notes
        
        Supported formats:
        - markdown: Markdown with headers, bullets, checkboxes
        - plain: Plain text
        - structured: JSON or YAML-like structure
        - mixed: Mix of formats
        
        Args:
            text: Meeting notes text
            
        Returns:
            Detected format name
        """
        # Check for markdown indicators
        markdown_patterns = [
            r'^#{1,6}\s+',  # Headers
            r'\[[ xX]\]',  # Checkboxes
            r'^[-*+]\s+',  # Bullets
            r'^\d+\.\s+',  # Numbered lists
            r'\*\*.+\*\*',  # Bold
            r'\`.+\`',  # Code inline
        ]
        
        markdown_score = sum(
            1 for pattern in markdown_patterns 
            if re.search(pattern, text, re.MULTILINE)
        )
        
        # Check for structured data
        if re.search(r'^\s*[\{\[]', text.strip()):
            return 'structured'
        
        if markdown_score >= 2:
            return 'markdown'
        
        return 'plain'
    
    @staticmethod
    def normalize(text: str) -> str:
        """
        Normalize text to a consistent format for processing
        
        Args:
            text: Raw meeting notes
            
        Returns:
            Normalized text
        """
        # Remove excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Normalize bullet points
        text = re.sub(r'^[\s\t]*[•●○◦⚫⚪︎]\s*', '- ', text, flags=re.MULTILINE)
        
        # Normalize checkboxes
        text = re.sub(r'\[[ ]\]', '[ ]', text)
        text = re.sub(r'\[[xX✓✔]\]', '[x]', text)
        
        # Remove HTML tags if present
        text = re.sub(r'<[^>]+>', '', text)
        
        # Normalize line endings
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        return text.strip()
    
    @staticmethod
    def extract_action_items(text: str) -> List[str]:
        """
        Quick extraction of obvious action items from text
        This is a fast pre-filter before LLM processing
        
        Args:
            text: Meeting notes text
            
        Returns:
            List of action item lines
        """
        action_patterns = [
            r'^.*\b(TODO|ACTION|TASK)\b.*$',
            r'^.*\b(need to|should|must|have to|will|going to)\b.*$',
            r'^.*\b(create|fix|update|implement|review|test|deploy|write|send|schedule|contact|prepare|complete|investigate|research)\b.*$',
            r'^\s*[-*+•]\s+\[[ ]\].*$',  # Unchecked checkboxes
            r'^\s*[-*+•]\s+.*\b(need|should|will|must)\b.*$',  # Bullets with action words
            r'^.*@\w+.*\b(will|should|need|must)\b.*$',  # Mentions with actions
            r'^.*\b(assigned to|responsible for|owner)\b.*$',  # Assignments
            r'^.*\b(by|due|before|deadline)\b.*\d{4}[-/]\d{2}[-/]\d{2}.*$',  # Date mentions
            r'^.*\b(urgent|ASAP|critical|important|priority)\b.*$',  # Priority indicators
        ]
        
        action_lines = []
        for line in text.split('\n'):
            line_stripped = line.strip()
            if not line_stripped or len(line_stripped) < 5:  # Skip empty or very short lines
                continue
            
            for pattern in action_patterns:
                if re.match(pattern, line, re.IGNORECASE):
                    action_lines.append(line_stripped)
                    break
        
        return action_lines
    
    @staticmethod
    def split_sections(text: str) -> Dict[str, str]:
        """
        Split meeting notes into sections based on headers
        
        Args:
            text: Meeting notes text
            
        Returns:
            Dictionary mapping section names to content
        """
        # Find markdown headers
        header_pattern = r'^(#{1,6})\s+(.+)$'
        
        sections = {}
        current_section = 'Introduction'
        current_content = []
        
        for line in text.split('\n'):
            header_match = re.match(header_pattern, line, re.MULTILINE)
            
            if header_match:
                # Save previous section
                if current_content:
                    sections[current_section] = '\n'.join(current_content).strip()
                
                # Start new section
                current_section = header_match.group(2).strip()
                current_content = []
            else:
                current_content.append(line)
        
        # Save last section
        if current_content:
            sections[current_section] = '\n'.join(current_content).strip()
        
        return sections
    
    @staticmethod
    def smart_truncate(text: str, max_length: int = 2000) -> str:
        """
        Intelligently truncate text while preserving action items and their context
        
        Args:
            text: Meeting notes text
            max_length: Maximum character length
            
        Returns:
            Truncated text with priority on actionable content
        """
        if len(text) <= max_length:
            return text
        
        # Extract action items with surrounding context
        lines = text.split('\n')
        important_content = []
        
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            
            # Check if this is an action line
            action_patterns = [
                r'\b(TODO|ACTION|TASK|need to|should|must|will|create|fix|update|implement)\b',
                r'\[[ ]\]',  # Checkboxes
                r'@\w+',  # Mentions
                r'\b(urgent|ASAP|critical|important|priority|deadline|due)\b',
            ]
            
            is_action = any(re.search(pattern, line, re.IGNORECASE) for pattern in action_patterns)
            
            if is_action:
                # Include previous line for context (if exists)
                if i > 0 and lines[i-1].strip():
                    prev_line = lines[i-1].strip()
                    if prev_line not in [item.strip() for item in important_content]:
                        important_content.append(prev_line)
                
                # Include the action line
                important_content.append(line_stripped)
                
                # Include next line for context (if exists and not empty)
                if i < len(lines) - 1 and lines[i+1].strip():
                    next_line = lines[i+1].strip()
                    # Add next line if it looks like continuation (no bullet/checkbox)
                    if not re.match(r'^[-*+•]\s|^\d+\.|\[[ xX]\]', next_line):
                        important_content.append(next_line)
            
            # Also include headers for context
            elif re.match(r'^#{1,6}\s+', line):
                important_content.append(line_stripped)
        
        # If we extracted action items, use them
        if important_content:
            result = '\n'.join(important_content)
            if len(result) <= max_length:
                return result
            # If still too long, truncate
            return result[:max_length].rsplit('\n', 1)[0]
        
        # No action items found, do smart truncation of original text
        truncated = text[:max_length]
        
        # Find last sentence end
        for delimiter in ['. ', '.\n', '! ', '!\n', '? ', '?\n']:
            pos = truncated.rfind(delimiter)
            if pos > max_length * 0.7:  # At least 70% of max
                return truncated[:pos + 1].strip()
        
        # Fallback: truncate at last newline
        last_newline = truncated.rfind('\n')
        if last_newline > 0:
            return truncated[:last_newline].strip()
        
        return truncated.strip()
