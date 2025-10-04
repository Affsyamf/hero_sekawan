import pandas as pd
from sqlalchemy.orm import Session
from io import BytesIO
from db.models import Product, Account
from utils.helpers import normalize_product_name

def run(contents: bytes, db: Session):
    # Load Excel
    xls = pd.ExcelFile(BytesIO(contents))
    df = pd.read_excel(xls, sheet_name="CHEMICAL", header=4)

    # Lookup target account
    account = db.query(Account).filter(Account.name == "PERSEDIAAN_OBAT").first()
    if not account:
        raise ValueError("Account 'PERSEDIAAN_OBAT' not found in accounts table.")

    updated, inserted, skipped = 0, 0, []
    seen_codes = set()  # prevent duplicates within this run

    for _, row in df.iterrows():
        raw_name = row.get("NAMABRG")
        code = row.get("KDBRG")

        if pd.isna(raw_name) or pd.isna(code):
            continue

        name = normalize_product_name(raw_name)
        code = str(code).strip().upper()

        # skip duplicate codes within Excel
        if code in seen_codes:
            skipped.append(code)
            continue
        seen_codes.add(code)

        # Try to find existing product by code or name
        product = (
            db.query(Product)
            .filter((Product.code == code) | (Product.name == name))
            .first()
        )

        if product:
            # Update existing product’s code/name/account if needed
            if not product.code:
                product.code = code
            if not product.account_id:
                product.account_id = account.id
            updated += 1
        else:
            # Create new product
            new_product = Product(
                code=code,
                name=name,
                unit=None,
                account_id=account.id,
            )
            db.add(new_product)
            inserted += 1

    db.commit()

    return {
        "updated": updated,
        "inserted": inserted,
        "skipped_count": len(skipped),
        "skipped_samples": skipped[:10],
        "account_id_used": account.id,
    }