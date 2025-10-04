"""Date and time utilities"""

from datetime import datetime, timedelta
from typing import Tuple

def get_date_range(start_date: str, end_date: str = None) -> Tuple[datetime, datetime]:
    """Parse and validate date range"""
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d')
        else:
            end = start
        
        # Ensure start is not after end
        if start > end:
            start, end = end, start
            
        return start, end
    except ValueError as e:
        raise ValueError(f"Invalid date format. Use YYYY-MM-DD: {e}")

def format_date_for_api(date_obj: datetime) -> str:
    """Format datetime object for external API calls"""
    return date_obj.strftime('%Y-%m-%d')

def get_current_date_string() -> str:
    """Get current date as string in API format"""
    return datetime.now().strftime('%Y-%m-%d')

def is_date_in_future(date_str: str) -> bool:
    """Check if given date is in the future"""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        return date_obj.date() > datetime.now().date()
    except ValueError:
        return False