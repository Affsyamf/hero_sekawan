# backend/api/excel_import/lap_chemical.py
import pandas as pd
from io import BytesIO
from sqlalchemy.orm import Session
from db.models import Stock_Movement, Stock_Movement_Detail, Product
import math

# ---- safe helpers (reuse from lap_pembelian) ----
def safe_str(value):
    if pd.isna(value):
        return None
    s = str(value).strip()
    return None if s.lower() == "nan" or s == "" else s

def safe_date(value):
    ts = pd.to_datetime(value, errors="coerce")
    if pd.isna(ts):
        return None
    return ts.to_pydatetime()

def safe_number(value):
    """Convert NaN/inf to None, else return float/int."""
    if value is None or (isinstance(value, float) and (math.isnan(value) or math.isinf(value))):
        return None
    return value

def run(contents: bytes, db: Session):
    df = pd.read_excel(
        BytesIO(contents),
        sheet_name="CHEMICAL",
        header=4
    )
    df = df.iloc[:, :-2]  # drop trailing junk cols

    inserted = {"movements": 0, "details": 0, "skipped": 0, "errors": []}
    movements_map = {}  # (code, date) -> Stock_Movement

    for idx, row in df.iterrows():
        excel_row = idx + 5  # offset since header=4

        code = safe_str(row.get("NOBUKTI"))
        tanggal = safe_date(row.get("TANGGAL"))
        qty = safe_number(row.get("QTY"))
        nama_brg = safe_str(row.get("NAMABRG"))

        # --- Required fields check ---
        if not code or not tanggal or qty is None or not nama_brg:
            inserted["skipped"] += 1
            continue

        # --- find product ---
        product = db.query(Product).filter_by(name=nama_brg.upper()).first()
        if not product:
            inserted["errors"].append(
                {"row": excel_row, "reason": f"product not found: {nama_brg}"}
            )
            continue

        # --- reuse or create Stock_Movement ---
        key = (code, tanggal)
        if key not in movements_map:
            movement = Stock_Movement(date=tanggal, code=code)
            db.add(movement)
            db.flush()  # ensure movement.id available
            movements_map[key] = movement
            inserted["movements"] += 1
        else:
            movement = movements_map[key]

        # --- create Stock_Movement_Detail ---
        detail = Stock_Movement_Detail(
            quantity=qty,
            product_id=product.id,
            stock_movement_id=movement.id,
        )
        db.add(detail)
        inserted["details"] += 1

    return inserted
