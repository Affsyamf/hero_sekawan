import pandas as pd
from sqlalchemy.orm import Session
from io import BytesIO
from db.models import Design, Design_Type
import re

def normalize_design_type(value: str) -> str:
    if not isinstance(value, str):
        return str(value or "")

    # Uppercase + trim
    value = value.strip().upper()

    # Replace curly quotes/apostrophes with nothing
    value = value.replace("’", "").replace("‘", "").replace("'", "")

    # Remove all non-alphanumeric (except spaces)
    value = re.sub(r"[^A-Z0-9 ]", "", value)

    # Collapse multiple spaces → single space
    value = re.sub(r"\s+", " ", value)

    return value

def get_or_create_design_type(db: Session, raw_value: str):
    normalized = normalize_design_type(raw_value)
    dtype = db.query(Design_Type).filter_by(name=normalized).first()
    if not dtype:
        dtype = Design_Type(name=normalized)
        db.add(dtype)
        db.flush()  # assign ID before commit
    return dtype

def run(contents: bytes, db: Session):
    df = pd.read_excel(
        BytesIO(contents),
        sheet_name="TEMPLATE QTY",
        header=2,
        usecols="A:E"
    )

    seen = set()
    added, skipped, unknown = 0, 0, []
    

    for _, row in df.iterrows():
        opj = row.get("OPJ")
        if pd.isna(opj):
            continue  # skip rows with no OPJ

        code = str(row.get("DESIGN") or "").strip()
        type_raw = str(row.get("JENIS KAIN") or "").strip()
        roll = row.get("ROLL")
        tgl = row.get("TGL")

        if not code or not type_raw:
            continue

        if code in seen:
            continue
        seen.add(code)

        dtype = get_or_create_design_type(db, type_raw)
        design = Design(code=code, type=dtype)
        added += 1
        db.add(design)

    return {
        "added": added,
        "skipped": skipped,
        "unknown_types": sorted(set(unknown))  # unique list of unknown types
    }
