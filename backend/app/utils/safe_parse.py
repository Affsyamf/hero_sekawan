import pandas as pd
import math
from decimal import Decimal

def safe_str(value):
    if pd.isna(value):
        return None
    s = str(value).strip()
    return None if s.lower() == "nan" or s == "" else s

def safe_date(value):
    ts = pd.to_datetime(value, errors="coerce")
    if pd.isna(ts):
        return None
    return ts.date()

def safe_number(value):
    # Handle series/list
    if isinstance(value, (pd.Series, list, tuple)):
        if len(value) == 0:
            return None
        value = value.iloc[0] if hasattr(value, "iloc") else value[0]

    if value is None:
        return None

    # Tolerate "46,375" style decimals
    try:
        f = float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None

    if math.isnan(f) or math.isinf(f):
        return None
    return f

def sanitize(obj):
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize(v) for v in obj]
    return obj