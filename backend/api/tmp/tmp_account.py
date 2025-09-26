import pandas as pd
import re
from sqlalchemy.orm import Session
from io import BytesIO
from db.models import Account  # assuming you have it in models.py

def normalize(value: str) -> str:
    """Clean and standardize text values"""
    if not isinstance(value, str):
        return str(value)
    value = value.replace(".", " ")               # remove dots
    value = re.sub(r"\s+", "_", value.strip())    # replace spaces with _
    return value.upper()

def run(contents: bytes, db: Session):
    # Load all sheets
    xls = pd.ExcelFile(BytesIO(contents))
    frames = []

    for sheet in xls.sheet_names:
        df = pd.read_excel(BytesIO(contents), sheet_name=sheet, header=6)
        df = df.iloc[:, :-2]  # drop trailing columns
        frames.append(df)

    all_data = pd.concat(frames, ignore_index=True)

    # Extract unique accounts
    account_df = (
        all_data[["KETERANGAN", "NO.ACC", "ACCOUNT"]]
        .dropna()
        .drop_duplicates()
    )

    # Deduplicate by account_no
    unique_accounts = {}
    for _, row in account_df.iterrows():
        acc_no = int(row["NO.ACC"])
        if acc_no not in unique_accounts:
            unique_accounts[acc_no] = {
                "account_no": acc_no,
                "name": normalize(row["ACCOUNT"]),
                "alias": normalize(row["KETERANGAN"]),
            }

    # Insert into DB
    for acc in unique_accounts.values():
        obj = Account(**acc)
        db.merge(obj)  # merge avoids duplicates
    db.commit()

    return list(unique_accounts.values())