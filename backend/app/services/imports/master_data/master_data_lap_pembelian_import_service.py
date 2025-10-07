from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from io import BytesIO
import pandas as pd
import math
from openpyxl import load_workbook

from app.models import (
    Product,
    Supplier, 
    Account, 
    AccountType,
)

from app.utils.normalise import normalise_product_name, normalise_account_name, normalise_supplier_name

class MasterDataLapPembelianImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def _run(self, file: UploadFile):
        contents: bytes = file.file.read()

        xls = pd.ExcelFile(BytesIO(contents))
        frames = []
        for sheet in xls.sheet_names:
            df = pd.read_excel(BytesIO(contents), sheet_name=sheet, header=6)
            df = df.iloc[:, :-2]  # drop trailing junk cols
            frames.append(df)

        all_data = pd.concat(frames, ignore_index=True)

        # Caches
        seen_accounts = set()
        seen_products = set()
        seen_suppliers = set()

        summary = {
            "accounts": {"inserted": 0, "skipped": 0},
            "products": {"inserted": 0, "skipped": 0},
            "suppliers": {"inserted": 0, "skipped": 0},
        }

        for _, row in all_data.iterrows():
            # --- Accounts ---
            acc_no = row.get("NO.ACC")
            acc_name = row.get("ACCOUNT")
            if pd.notna(acc_no) and pd.notna(acc_name):
                acc_no = int(acc_no)
                if acc_no not in seen_accounts:
                    seen_accounts.add(acc_no)
                    existing = self.db.query(Account).filter_by(account_no=acc_no).first()
                    if existing:
                        summary["accounts"]["skipped"] += 1
                    else:
                        self.db.add(Account(
                            account_no=acc_no,
                            name=normalise_account_name(acc_name),
                            account_type=AccountType.Goods.value,  # default to 'Goods'
                        ))
                        summary["accounts"]["inserted"] += 1

            # --- Products ---
            raw_name = row.get("NAMA BARANG")
            if pd.notna(raw_name):
                name = normalise_product_name(raw_name)
                if name and name not in seen_products:
                    seen_products.add(name)
                    unit = str(row.get("SATUAN") or "").strip().upper() or None
                    acc_no = row.get("NO.ACC")
                    account_id = None
                    if pd.notna(acc_no):
                        existing_acc = self.db.query(Account).filter_by(account_no=int(acc_no)).first()
                        if existing_acc:
                            account_id = existing_acc.id

                    existing = self.db.query(Product).filter_by(name=name).first()
                    if existing:
                        summary["products"]["skipped"] += 1
                    else:
                        self.db.add(Product(
                            code=None,
                            name=name,
                            unit=unit,
                            account_id=account_id,
                        ))
                        summary["products"]["inserted"] += 1

            # --- Suppliers ---
            code = str(row.get("KODE SUPPLIER") or "").strip().upper()
            name = normalise_supplier_name(row.get("SUPPLIER") or "")
            if code and name and code not in seen_suppliers:
                seen_suppliers.add(code)
                existing = self.db.query(Supplier).filter_by(code=code).first()
                if existing:
                    summary["suppliers"]["skipped"] += 1
                else:
                    self.db.add(Supplier(
                        code=code,
                        name=name,
                        contact_info=None,
                    ))
                    summary["suppliers"]["inserted"] += 1

        self.db.flush()  # ensure IDs are available

        return summary