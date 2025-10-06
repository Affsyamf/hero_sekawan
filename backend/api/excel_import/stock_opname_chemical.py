import pandas as pd
import re
from sqlalchemy.orm import Session
from io import BytesIO
import math
from datetime import datetime

from db.models import Product, Stock_Opname, Stock_Opname_Detail, Ledger
from models.enum import LedgerRef, LedgerLocation

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

def run(contents: bytes, db: Session):
    # Load Excel
    xls = pd.ExcelFile(BytesIO(contents))
    start_date = datetime(2025,7,31)
    
    df = pd.read_excel(xls, sheet_name="GUDANG BESAR", header=4)
    df = df[df["NO"].notna()]

    so_code = "SO-" + start_date.strftime("%Y%m%d")
    
    stock_opname = Stock_Opname(
        date=start_date,
        code=so_code,
    )
    db.add(stock_opname)
    db.flush()
    
    skipped = 0
    skipped_products = []
    added = 0
    
    for _, row in df.iterrows():
        prod_name = safe_str(normalize_product_name(row.get("NAMA BARANG")))
        if prod_name is None:
            continue

        system_qty = safe_number(row.get("SALDO AWAL")) + safe_number(row.get("MUTASI MASUK")) - safe_number(row.get("MUTASI KELUAR"))
        physical_qty = safe_number(row.get("FISIK"))

        product = db.query(Product).filter_by(name=prod_name).first()
        if not product:
            print(f"⚠️ Product not found: {prod_name}, skipping")
            skipped += 1
            skipped_products.append(prod_name)
            continue
        
        detail = Stock_Opname_Detail(
            product=product,
            system_quantity=system_qty,
            physical_quantity=physical_qty,
            stock_opname=stock_opname
        )
        db.add(detail)

        # --- Ledger ---
        difference = system_qty - physical_qty
        if difference != 0:
            if difference > 0:
                # System > Physical: OUT from Gudang
                ledger_entry = Ledger(
                    date=start_date,
                    ref=LedgerRef.StockOpname.value,
                    ref_code=so_code,
                    location=LedgerLocation.Gudang.value,
                    quantity_in=0.0,
                    quantity_out=-difference,  # make positive
                    product=product,
                )
            else:
                # System < Physical: IN to Gudang, OUT from Kitchen
                ledger_entry_kitchen = Ledger(
                    date=start_date,
                    ref=LedgerRef.StockOpname.value,
                    ref_code=so_code,
                    location=LedgerLocation.Kitchen.value,
                    quantity_in=0.0,
                    quantity_out=difference,  # make positive
                    product=product,
                )

                ledger_entry = Ledger(
                    date=start_date,
                    ref=LedgerRef.StockOpname.value,
                    ref_code=so_code,
                    location=LedgerLocation.Gudang.value,
                    quantity_in=difference,  # make positive
                    quantity_out=0.0,
                    product=product,
                )

                db.add(ledger_entry_kitchen)

            db.add(ledger_entry)
        added += 1

    db.commit()

    return {
        "skipped": skipped,
        "skipped_products": skipped_products,
        "added": added
    }