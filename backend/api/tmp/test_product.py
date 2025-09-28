import pandas as pd
import re
from sqlalchemy.orm import Session
from db.models import Product

def normalize_product_name(value: str) -> str:
    if not isinstance(value, str):
        value = str(value or "")
    value = value.strip()
    value = re.sub(r"\s+", " ", value)
    return value.upper()

def run(contents: bytes, db: Session):
    # --- Load Excel ---
    xls = pd.ExcelFile(contents)
    frames = []
    for sheet in xls.sheet_names:
        df = pd.read_excel(contents, sheet_name=sheet, header=6)
        df = df.iloc[:, :-2]
        frames.append(df)
    all_data = pd.concat(frames, ignore_index=True)

    # --- Collect product names from Excel ---
    excel_names = set(
        normalize_product_name(x)
        for x in all_data["NAMA BARANG"].dropna().unique()
    )

    # --- Collect product names from DB ---
    db_names = set(
        name for (name,) in db.query(Product.name).all()
    )

    # --- Compare ---
    missing_in_db = excel_names - db_names
    extra_in_db = db_names - excel_names

    print(f"✅ Total in Excel: {len(excel_names)}")
    print(f"✅ Total in DB: {len(db_names)}")
    print(f"❌ Missing in DB: {len(missing_in_db)}")
    print(f"❌ Extra in DB: {len(extra_in_db)}")

    if missing_in_db:
        print("\n--- Missing in DB ---")
        for name in sorted(list(missing_in_db))[:20]:  # show first 20
            print(name)

    if extra_in_db:
        print("\n--- Extra in DB ---")
        for name in sorted(list(extra_in_db))[:20]:
            print(name)
