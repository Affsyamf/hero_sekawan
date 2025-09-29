import pandas as pd
import re
from sqlalchemy.orm import Session
from io import BytesIO
from db.models import Product, Account, Supplier

# ---------- Normalizers ----------
def normalize_account_name(value: str) -> str:
    if not isinstance(value, str):
        value = str(value or "")
    value = value.replace(".", " ")               # remove dots
    value = re.sub(r"\s+", "_", value.strip())    # spaces → underscore
    return value.upper()

def normalize_product_name(value: str) -> str:
    if not isinstance(value, str):
        value = str(value or "")
    value = value.strip()
    value = re.sub(r"\s+", " ", value)            # collapse spaces
    return value.upper()

def normalize_supplier_name(value: str) -> str:
    if not isinstance(value, str):
        value = str(value or "")
    value = value.strip()
    value = re.sub(r"\s+", " ", value)
    return value.upper()

# ---------- Combined run ----------
def run(contents: bytes, db: Session):
    # Load all sheets
    xls = pd.ExcelFile(BytesIO(contents))
    frames = []
    for sheet in xls.sheet_names:
        df = pd.read_excel(BytesIO(contents), sheet_name=sheet, header=6)
        df = df.iloc[:, :-2]  # drop trailing columns
        frames.append(df)

    all_data = pd.concat(frames, ignore_index=True)

    # --- Accounts ---
    seen_accounts = set()
    for _, row in all_data.iterrows():
        acc_no = row.get("NO.ACC")
        acc_name = row.get("ACCOUNT")
        if pd.isna(acc_no) or pd.isna(acc_name):
            continue

        acc_no = int(acc_no)
        if acc_no in seen_accounts:
            continue
        seen_accounts.add(acc_no)

        account = Account(
            account_no=acc_no,
            name=normalize_account_name(acc_name),
        )
        db.add(account)

    # Build account lookup (so products can reference correct FK)
    db.flush()
    account_lookup = {a.account_no: a.id for a in db.query(Account).all()}

    # --- Products ---
    seen_products = set()
    for _, row in all_data.iterrows():
        raw_name = row.get("NAMA BARANG")
        if pd.isna(raw_name):
            continue

        name = normalize_product_name(raw_name)
        unit = str(row.get("SATUAN") or "").strip().upper() or None
        acc_no = row.get("NO.ACC")
        account_id = account_lookup.get(int(acc_no)) if pd.notna(acc_no) else None

        if name in seen_products:
            continue
        seen_products.add(name)

        product = Product(
            code=None,
            name=name,
            unit=unit,
            account_id=account_id,
        )
        db.add(product)

    # --- Suppliers ---
    seen_suppliers = set()
    for _, row in all_data.iterrows():
        code = str(row.get("KODE SUPPLIER") or "").strip().upper()
        name = normalize_supplier_name(row.get("SUPPLIER") or "")

        if not code or not name:
            continue
        if code in seen_suppliers:
            continue
        seen_suppliers.add(code)

        supplier = Supplier(
            code=code,
            name=name,
            contact_info=None,
        )
        db.add(supplier)
