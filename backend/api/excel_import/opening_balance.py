import pandas as pd
import re
from sqlalchemy.orm import Session
from io import BytesIO
from db.models import Product, Purchasing_Detail, Purchasing, Supplier
import math
from datetime import datetime

from utils.helpers import normalize_product_name

def safe_str(value):
    if pd.isna(value):
        return None
    s = str(value).strip()
    return None if s.lower() == "nan" or s == "" else s

def safe_number(value):
    """Convert value to float if possible. Return None for NaN/inf/empty."""
    if value is None:
        return None
    try:
        val = float(value)
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    except (ValueError, TypeError):
        return None

def get_or_create_system_supplier(session: Session):
    supplier = session.query(Supplier).filter_by(code="SYSTEM").first()
    if not supplier:
        supplier = Supplier(code="SYSTEM", name="System Opening Balance")
        session.add(supplier)
        session.commit()
    return supplier

def run(contents: bytes, db: Session):
    system_supplier = get_or_create_system_supplier(db)
    
    # Load Excel
    xls = pd.ExcelFile(BytesIO(contents))
    start_date = datetime(2025,7,31)
    
    df = pd.read_excel(xls, sheet_name="GUDANG BESAR", header=4)
    df = df[df["NO"].notna()]
    
    purchasing = Purchasing(
        date=start_date,
        code="OPENBAL-" + start_date.strftime("%Y%m%d"),
        purchase_order="OPENBAL",
        supplier=system_supplier
    )
    db.add(purchasing)
    db.flush()
    
    skipped = 0
    skipped_products = []
    added = 0
    
    for _, row in df.iterrows():
        prod_name = safe_str(normalize_product_name(row.get("NAMA BARANG")))
        if prod_name is None:
            continue
        
        qty = safe_number(row.get("SALDO AWAL"))
        price_plus_ppn = safe_number(row.get("JUMLAH SALDO AWAL + PPN"))
        if price_plus_ppn is None:
            price_plus_ppn = safe_number(row.get("JUMLAH FISIK"))
            dpp = price_plus_ppn
            unit_price = dpp / qty if qty else 0
            ppn = 0.0
        else:
            dpp = price_plus_ppn / 1.11
            unit_price = dpp / qty if qty else 0
            ppn = dpp * 0.11
        
        product = db.query(Product).filter_by(name=prod_name).first()
        if not product:
            print(f"⚠️ Product not found: {prod_name}, skipping")
            skipped += 1
            skipped_products.append(prod_name)
            continue
        
        detail = Purchasing_Detail(
            product=product,
            purchasing=purchasing,
            quantity=qty,
            price=unit_price,
            discount=0.0,
            ppn=ppn,
            pph=0.0,
            dpp=dpp,
            tax_no=None,
            exchange_rate=0.0,
        )
        db.add(detail)
        added += 1

    db.commit()

    return {
        "skipped": skipped,
        "skipped_products": skipped_products,
        "added": added
    }
