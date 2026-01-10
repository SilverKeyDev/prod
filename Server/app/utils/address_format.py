"""
Address formatting utilities for SilverKey application.
Converts normalized address formats to readable addresses and provides utility functions.
"""

import re
from typing import List, Optional
from datetime import datetime


def format_filename_to_address(filename: str) -> str:
    """
    Converts a known SilverKey PDF filename pattern to a readable address.
    Accepts forms like:
      "<hash>_777_W_Middlefield_Rd_Mountain_View_CA_94043_USA.pdf"
      "777_W_Middlefield_Rd_Mountain_View_CA_94043_USA.pdf"
      "<hash>_123_Main_St_New_York_NY_10001.pdf"
    
    Args:
        filename: The filename to convert to an address
        
    Returns:
        str: Formatted address string
    """
    if not filename:
        return ""

    # 1) strip extension (case-insensitive)
    clean_name = re.sub(r'\.[^.]+$', '', filename, flags=re.IGNORECASE)

    # 2) split tokens
    parts = [part for part in clean_name.split("_") if part]

    if len(parts) == 0:
        return ""

    # 3) drop leading hash-like prefix if present (e.g., "10421f3ef19c483a9")
    # Check for hexadecimal hash patterns (10+ characters, only 0-9 and a-f)
    if len(parts) > 0 and re.match(r'^[0-9a-f]{10,}$', parts[0], re.IGNORECASE):
        parts = parts[1:]

    if len(parts) < 3:
        return " ".join(parts)

    # 4) drop trailing country if present
    last = parts[-1]
    if re.match(r'^(USA|US|United|States|UnitedStates)$', last, re.IGNORECASE):
        parts = parts[:-1]

    # 5) zip (5 or 5-4) expected near the end
    zip_index = -1
    for i in range(len(parts) - 1, -1, -1):
        if re.match(r'^\d{5}(?:-\d{4})?$', parts[i]):
            zip_index = i
            break

    # 6) state (2 uppercase letters) should be right before zip (if present) or near end
    state_index = -1
    start_search = zip_index - 1 if zip_index > -1 else len(parts) - 1
    for i in range(start_search, -1, -1):
        if re.match(r'^[A-Z]{2}$', parts[i]):
            state_index = i
            break

    # If no clear state token, fallback to simple spacing/commas
    if state_index == -1:
        return _naive_join(parts)

    # 7) street vs city split: find the last street suffix BEFORE the state
    street_suffixes = {
        "St", "Ave", "Rd", "Dr", "Ln", "Blvd", "Way", "Ct", "Pl", "Ter", "Pkwy",
        "Street", "Avenue", "Road", "Drive", "Lane", "Boulevard", "Court", "Place", 
        "Terrace", "Parkway", "Trail", "Cir", "Circle", "Hwy", "Highway"
    }

    street_end_index = -1
    for i in range(state_index - 1, -1, -1):
        if parts[i] in street_suffixes:
            street_end_index = i
            break

    # If we didn't find a suffix, try a soft heuristic: include tokens up to the first capitalized city-style token boundary
    if street_end_index != -1:
        street_parts = parts[:street_end_index + 1]
        city_parts = parts[street_end_index + 1:state_index]
    else:
        # Soft guess: if address starts with a number, keep tokens until we hit something
        # that looks like a city start (usually after the number + a couple tokens).
        starts_with_number = re.match(r'^\d+[A-Za-z]?$', parts[0]) is not None
        cutoff = min(4, state_index) if starts_with_number else min(3, state_index)
        street_parts = parts[:cutoff]
        city_parts = parts[cutoff:state_index]

    state = parts[state_index]
    zip_code = parts[zip_index] if zip_index == state_index + 1 else None
    tail = parts[zip_index + 1:] if zip_index > -1 else parts[state_index + 1:]  # country already removed

    formatted = []
    if street_parts:
        formatted.append(" ".join(street_parts))
    if city_parts:
        formatted.append(_title_case(" ".join(city_parts)))
    formatted.append(state)
    if zip_code:
        formatted.append(zip_code)
    if tail:
        formatted.append(" ".join(tail))

    return ", ".join(formatted)


def _naive_join(tokens: List[str]) -> str:
    """
    Reasonable fallback: split in half with a comma.
    
    Args:
        tokens: List of address tokens
        
    Returns:
        str: Joined address string
    """
    if len(tokens) <= 3:
        return ", ".join(tokens)
    mid = len(tokens) // 2
    return f"{' '.join(tokens[:mid])}, {' '.join(tokens[mid:])}"


def _title_case(s: str) -> str:
    """
    Convert string to title case.
    
    Args:
        s: String to convert
        
    Returns:
        str: Title cased string
    """
    return " ".join(
        word[0].upper() + word[1:].lower() if word else word
        for word in s.split(" ")
    )


def truncate_text(text: str, max_length: int = 50) -> str:
    """
    Truncate without chopping mid-word when possible.
    
    Args:
        text: Text to truncate
        max_length: Maximum length before truncation
        
    Returns:
        str: Truncated text with ellipsis if needed
    """
    if not text or len(text) <= max_length:
        return text
    
    slice_text = text[:max_length - 3]
    cut = slice_text.rfind(" ")
    return (slice_text[:cut] if cut > 0 else slice_text) + "..."


def format_date(date_string: str) -> str:
    """
    Formats a date string to "MMM D, YYYY".
    Returns the original string if parsing fails.
    
    Args:
        date_string: Date string to format
        
    Returns:
        str: Formatted date string or original if parsing fails
    """
    if not date_string:
        return ""
    
    try:
        date_obj = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        return date_obj.strftime("%b %d, %Y")
    except (ValueError, AttributeError):
        try:
            # Try parsing as a standard date format
            date_obj = datetime.strptime(date_string, "%Y-%m-%d")
            return date_obj.strftime("%b %d, %Y")
        except ValueError:
            return date_string


def normalize_address(address: str) -> str:
    """
    Normalize address by replacing spaces and commas with underscores.
    
    Args:
        address: Original address string
        
    Returns:
        str: Normalized address string
    """
    return address.replace(' ', '_').replace(',', '_')


def safe_normalize_address(address: str) -> str:
    """
    Normalize address with fallback to simple lowercase strip if normalization fails.
    This wrapper prevents errors when normalize_address() fails.
    
    Args:
        address: Original address string
        
    Returns:
        str: Normalized address string or fallback to stripped lowercase
    """
    if not address:
        return ""
    try:
        return normalize_address(address)
    except Exception:
        return address.strip().lower()


def denormalize_address(normalized_address: str) -> str:
    """
    Convert normalized address back to readable format using the filename formatter.
    
    Args:
        normalized_address: Normalized address string with underscores
        
    Returns:
        str: Readable address string
    """
    # Use the filename formatter to properly parse and format the address
    return format_filename_to_address(normalized_address)
