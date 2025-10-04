# backend/api/excel_import/master_data/master_data_design.py
import pandas as pd
from sqlalchemy.orm import Session
from io import BytesIO
from db.models import Design, Design_Type
import re

from utils.helpers import normalize_design_type, normalize_design_name

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

        code = normalize_design_name(str(row.get("DESIGN") or ""))
        type_raw = str(row.get("JENIS KAIN") or "")
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
