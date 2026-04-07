"""Phone number normalization utilities"""

def normalize_msisdn(msisdn: str) -> str:
    """
    Normalize MSISDN to consistent international format (13 digits: 234...)
    
    Examples:
        07042411717 -> 2347042411717
        +2347042411717 -> 2347042411717
        2347042411717 -> 2347042411717
        7042411717 -> 2347042411717
        08012345678 -> 2348012345678
    """
    # Remove all non-digit characters (handles +234 format)
    cleaned = ''.join(c for c in msisdn if c.isdigit())
    
    # Convert local format (starting with 0) to international
    if cleaned.startswith('0') and len(cleaned) == 11:
        cleaned = '234' + cleaned[1:]
    
    # Add country code if missing and length is 10
    if len(cleaned) == 10 and not cleaned.startswith('234'):
        cleaned = '234' + cleaned
    
    # Validate final format (should be 13 digits starting with 234)
    if len(cleaned) != 13 or not cleaned.startswith('234'):
        raise ValueError(f"Invalid MSISDN format after normalization: {msisdn} -> {cleaned}")
    
    return cleaned
