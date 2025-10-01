import re

def normalize_design_type(value: str) -> str:
    if not isinstance(value, str):
        return str(value or "")

    # Uppercase + trim
    value = value.strip().upper()

    # Replace curly quotes/apostrophes with nothing
    value = value.replace("’", "").replace("‘", "").replace("'", "")

    value = re.sub(r"[^A-Z0-9 ]", "", value)

    # Collapse multiple spaces → single space
    value = re.sub(r"\s+", " ", value)

    return value

def normalize_product_name(value: str) -> str:
    """Normalize product names but keep spaces intact."""
    if not isinstance(value, str):
        value = str(value or "")
    # Remove leading/trailing spaces
    value = value.strip()
    # Collapse multiple spaces to single
    value = re.sub(r"\s+", " ", value)
    # Uppercase for consistency
    return value.upper()

def normalize_design_name(value: str) -> str:
    if not value:
        return None

    s = str(value).strip()              # remove leading/trailing spaces
    s = re.sub(r"\s+", " ", s)          # collapse multiple spaces into one
    return s