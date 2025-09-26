import pandas as pd
import re
from sqlalchemy.orm import Session
from io import BytesIO
from db.models import Product, Account

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

def run(contents: bytes, db: Session):
    # Load all sheets
    xls = pd.ExcelFile(BytesIO(contents))
    frames = []
    
    accounts = db.query(Account).all()
    account_lookup = {int(a.account_no): a.id for a in accounts if a.account_no is not None}

    for sheet in xls.sheet_names:
        df = pd.read_excel(BytesIO(contents), sheet_name=sheet, header=6)
        df = df.iloc[:, :-2]  # drop trailing columns
        frames.append(df)

    all_data = pd.concat(frames, ignore_index=True)

    seen = set()
    for _, row in all_data.iterrows():
        raw_name = row.get("NAMA BARANG")
        if pd.isna(raw_name):
            continue

        name = normalize_product_name(raw_name)
        unit = str(row.get("SATUAN") or "").strip().upper() or None
        acc_no = row.get("NO.ACC")
        account_id = account_lookup.get(int(acc_no)) if pd.notna(acc_no) else None

        # Enforce uniqueness
        if name in seen:
            continue
        seen.add(name)

        product = Product(
            code=None,
            name=name,
            unit=unit,
            account_id=account_id,
        )
        db.add(product)

    db.commit()