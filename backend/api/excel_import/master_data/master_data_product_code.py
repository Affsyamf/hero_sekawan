import pandas as pd
import re
from sqlalchemy.orm import Session
from io import BytesIO
from db.models import Product, Account

from utils.helpers import normalize_product_name

def run(contents: bytes, db: Session):
    # Load Excel
    xls = pd.ExcelFile(BytesIO(contents))

    # Adjust sheet name if needed (you used "CHEMICAL")
    df = pd.read_excel(xls, sheet_name="CHEMICAL", header=4)

    updated, missing = 0, []

    for _, row in df.iterrows():
        raw_name = row.get("NAMABRG")
        code = row.get("KDBRG")

        if pd.isna(raw_name) or pd.isna(code):
            continue

        name = normalize_product_name(raw_name)
        code = str(code).strip().upper()

        # Find product by normalized name
        product = db.query(Product).filter(Product.name == name).first()

        if product:
            product.code = code
            updated += 1
        else:
            missing.append(name)

    db.commit()

    return {
        "updated": updated,
        "missing": missing[:20],  # show first 20 missing for debugging
        "missing_count": len(missing),
    }
