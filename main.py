#!/usr/bin/env python3
"""
Meeting to Task Converter
Extracts action items from meeting notes and creates tasks in Monday.com
"""

import click
import sys
from pathlib import Path
from dotenv import load_dotenv
from task_extractor import TaskExtractor
from monday_client import MondayClient

load_dotenv()


@click.command()
@click.option('--input', '-i', type=click.Path(exists=True), help='Meeting notes file')
@click.option('--board-id', '-b', help='Monday.com board ID')
@click.option('--interactive', is_flag=True, help='Run in interactive mode')
@click.option('--dry-run', is_flag=True, help='Extract tasks without creating them')
def main(input, board_id, interactive, dry_run):
    """Convert meeting notes to Monday.com tasks"""
    
    if interactive:
        run_interactive_mode()
        return
    
    if not input:
        click.echo("Error: Please provide an input file with --input or use --interactive mode")
        sys.exit(1)
    
    # Read meeting notes
    meeting_text = Path(input).read_text()
    
    # Extract tasks
    click.echo("🔍 Extracting tasks from meeting notes...")
    extractor = TaskExtractor()
    tasks = extractor.extract_tasks(meeting_text)
    
    if not tasks:
        click.echo("❌ No tasks found in the meeting notes")
        return
    
    click.echo(f"✅ Found {len(tasks)} task(s):\n")
    for i, task in enumerate(tasks, 1):
        click.echo(f"{i}. {task['title']}")
        if task.get('assignee'):
            click.echo(f"   👤 Assignee: {task['assignee']}")
        if task.get('due_date'):
            click.echo(f"   📅 Due: {task['due_date']}")
        click.echo()
    
    if dry_run:
        click.echo("🏃 Dry run mode - tasks not created")
        return
    
    # Create tasks in Monday.com
    if not board_id:
        click.echo("Error: Please provide --board-id to create tasks")
        sys.exit(1)
    
    monday = MondayClient()
    created_tasks = monday.create_tasks(board_id, tasks)
    
    click.echo(f"✅ Created {len(created_tasks)} task(s) in Monday.com")


def run_interactive_mode():
    """Interactive mode for entering meeting notes"""
    click.echo("📝 Interactive Meeting to Task Converter")
    click.echo("=" * 50)
    click.echo("Paste your meeting notes below (Ctrl+D when done):\n")
    
    try:
        meeting_text = sys.stdin.read()
    except KeyboardInterrupt:
        click.echo("\n\nCancelled.")
        return
    
    if not meeting_text.strip():
        click.echo("No meeting notes provided.")
        return
    
    # Extract and display tasks
    extractor = TaskExtractor()
    tasks = extractor.extract_tasks(meeting_text)
    
    if not tasks:
        click.echo("❌ No tasks found in the meeting notes")
        return
    
    click.echo(f"\n✅ Extracted {len(tasks)} task(s):")
    for i, task in enumerate(tasks, 1):
        click.echo(f"\n{i}. {task['title']}")
        if task.get('description'):
            click.echo(f"   {task['description']}")
        if task.get('assignee'):
            click.echo(f"   👤 {task['assignee']}")
    
    # Ask if user wants to create tasks
    if click.confirm('\nCreate these tasks in Monday.com?'):
        board_id = click.prompt('Enter Monday.com board ID')
        monday = MondayClient()
        created_tasks = monday.create_tasks(board_id, tasks)
        click.echo(f"\n✅ Created {len(created_tasks)} task(s)!")


if __name__ == '__main__':
    main()
