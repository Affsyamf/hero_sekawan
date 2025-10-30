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
    AccountParent
)

from app.utils.normalise import normalise_product_name, normalise_account_name, normalise_supplier_name
from app.utils.response import APIResponse

class MasterDataLapPembelianImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def _run(self, file: UploadFile):
        contents: bytes = file.file.read()

        EXCLUDE_SHEETS = {"JANUARI 2025", "FEB 2025"}
        
        xls = pd.ExcelFile(BytesIO(contents))
        frames = []
        for sheet in xls.sheet_names:
            if sheet.upper().strip() in EXCLUDE_SHEETS:
                continue
            
            df = pd.read_excel(BytesIO(contents), sheet_name=sheet, header=6)
            df = df.iloc[:, :-2]  # drop trailing junk cols
            frames.append(df)

        all_data = pd.concat(frames, ignore_index=True)

        # Caches
        seen_account_parents = set()
        seen_accounts = set()
        seen_products = set()
        seen_suppliers = set()

        summary = {
            "accounts": {"inserted": 0, "skipped": 0, "reason": []},
            "acc_parents": {"inserted": 0, "skipped": 0},
            "products": {"inserted": 0, "skipped": 0, "reason": []},
            "suppliers": {"inserted": 0, "skipped": 0},
        }

        for _, row in all_data.iterrows():
            # --- Accounts ---
            acc_no = row.get("NO.ACC")
            acc_name = row.get("ACCOUNT")
            if pd.notna(acc_no) and pd.notna(acc_name):
                acc_no = int(acc_no)
                parent = self.db.query(AccountParent).filter_by(account_no=acc_no).first()

                if acc_no not in seen_account_parents:
                    seen_account_parents.add(acc_no)
                    if not parent:
                        parent = AccountParent(account_no=acc_no)
                        self.db.add(parent)
                        self.db.flush()
                        summary["acc_parents"]["inserted"] += 1
                    else:
                        summary["acc_parents"]["skipped"] += 1

                acc_name_norm = normalise_account_name(acc_name)

                existing_acc = (
                    self.db.query(Account)
                    .filter_by(name=acc_name_norm, parent_id=parent.id)
                    .first()
                )
                if existing_acc or (acc_name_norm, parent.id) in seen_accounts:
                    summary["accounts"]["skipped"] += 1
                else:
                    account = Account(
                        name=acc_name_norm,
                        parent_id=parent.id,
                    )
                    self.db.add(account)
                    seen_accounts.add((acc_name_norm, parent.id))
                    summary["accounts"]["inserted"] += 1

            

        self.db.flush()

        # --- Products ---
        for _, row in all_data.iterrows():
            raw_name = row.get("NAMA BARANG")
            if pd.notna(raw_name):
                name = normalise_product_name(raw_name)
                if name and name not in seen_products:
                    seen_products.add(name)
                    unit = str(row.get("SATUAN") or "").strip().upper() or None
                    acc_no = row.get("NO.ACC")
                    acc_name = row.get("ACCOUNT")
                    account_id = None
                    
                    if pd.notna(acc_name):
                        acc_name_norm = normalise_account_name(acc_name)
                        acc_no = int(acc_no)
                        
                        existing_acc = (
                            self.db.query(Account)
                                .join(Account.parent)
                                .filter(
                                    Account.name == acc_name_norm,
                                    AccountParent.account_no == acc_no
                                )
                                .first()
                            )
                        if existing_acc:
                            account_id = existing_acc.id

                    existing = self.db.query(Product).filter_by(name=name).first()
                    if existing:
                        summary["products"]["skipped"] += 1
                    elif account_id == None:
                        summary["products"]["skipped"] += 1
                        summary["products"]["reason"].append(f"Account {acc_no} {acc_name_norm} Not Found: {name}")
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

        self.db.flush()

        return summary
    
    def preview(self, file: UploadFile):
        """
        Simulates the master-data import exactly like _run(),
        but never writes to DB. Returns counts + sample data.
        """

        EXCLUDE_SHEETS = {"JANUARI 2025", "FEB 2025"}

        def safe_int(x):
            try:
                if pd.isna(x):
                    return None
                return int(float(x))
            except (ValueError, TypeError):
                return None

        contents: bytes = file.file.read()
        xls = pd.ExcelFile(BytesIO(contents))
        frames = []
        for sheet in xls.sheet_names:
            if sheet.upper().strip() in EXCLUDE_SHEETS:
                continue
            df = pd.read_excel(BytesIO(contents), sheet_name=sheet, header=6)
            df = df.iloc[:, :-2]  # drop trailing junk cols
            frames.append(df)

        all_data = pd.concat(frames, ignore_index=True)

        # --- caches ------------------------------------------------------------
        seen_account_parents = set()
        seen_accounts = set()
        seen_products = set()
        seen_suppliers = set()

        to_insert = {
            "acc_parents": [],
            "accounts": [],
            "products": [],
            "suppliers": [],
        }
        skipped = {
            "acc_parents": [],
            "accounts": [],
            "products": [],
            "suppliers": [],
        }
        missing_account_refs = []

        # --- simulate import ---------------------------------------------------
        for _, row in all_data.iterrows():
            # ===== ACCOUNTS =====
            acc_no = safe_int(row.get("NO.ACC"))
            acc_name = row.get("ACCOUNT")
            if acc_no and pd.notna(acc_name):
                acc_name_norm = normalise_account_name(acc_name)

                # Parent check
                parent_exists = self.db.query(AccountParent).filter_by(account_no=acc_no).first()
                if acc_no not in seen_account_parents and not parent_exists:
                    to_insert["acc_parents"].append({"account_no": acc_no})
                    seen_account_parents.add(acc_no)
                else:
                    if acc_no not in seen_account_parents:
                        skipped["acc_parents"].append({"account_no": acc_no})

                # Account check
                parent = parent_exists or next(
                    (p for p in to_insert["acc_parents"] if p["account_no"] == acc_no),
                    None,
                )
                parent_id = getattr(parent_exists, "id", None)
                existing_acc = None
                if parent_id:
                    existing_acc = (
                        self.db.query(Account)
                        .filter_by(name=acc_name_norm, parent_id=parent_id)
                        .first()
                    )

                if existing_acc or (acc_name_norm, acc_no) in seen_accounts:
                    if acc_name_norm not in seen_accounts:
                        skipped["accounts"].append(
                            {"name": acc_name_norm, "account_no": acc_no, "reason": "Duplicate"}
                        )
                else:
                    to_insert["accounts"].append(
                        {"name": acc_name_norm, "account_no": acc_no}
                    )
                    seen_accounts.add((acc_name_norm, acc_no))

            # ===== PRODUCTS =====
            raw_name = row.get("NAMA BARANG")
            if pd.notna(raw_name):
                name = normalise_product_name(raw_name)
                if name and name not in seen_products:
                    seen_products.add(name)
                    unit = str(row.get("SATUAN") or "").strip().upper() or None

                    # ✅ now match to Account by ACCOUNT NAME (not NO.ACC)
                    acc_name_raw = row.get("ACCOUNT")
                    acc_name_norm = normalise_account_name(acc_name_raw) if pd.notna(acc_name_raw) else None

                    existing_product = self.db.query(Product).filter_by(name=name).first()
                    if existing_product:
                        skipped["products"].append(
                            {"name": name, "reason": "Already exists"}
                        )
                        continue

                    # 🔹 check if account with that name exists in DB or will exist after import
                    account_exists = None
                    if acc_name_norm:
                        account_exists = (
                            self.db.query(Account)
                            .filter_by(name=acc_name_norm)
                            .first()
                        )

                    will_exist = bool(
                        account_exists
                        or any(a["name"] == acc_name_norm for a in to_insert["accounts"])
                    )

                    if will_exist:
                        to_insert["products"].append(
                            {
                                "name": name,
                                "unit": unit,
                                "account_name": acc_name_norm,
                                "account_found": True,
                            }
                        )
                    else:
                        to_insert["products"].append(
                            {
                                "name": name,
                                "unit": unit,
                                "account_name": acc_name_norm,
                                "account_found": False,
                                "has_missing_account": True,
                            }
                        )
                        missing_account_refs.append(
                            {
                                "name": name,
                                "account_name": acc_name_norm,
                                "reason": "Account not found",
                            }
                        )

            # ===== SUPPLIERS =====
            code = str(row.get("KODE SUPPLIER") or "").strip().upper()
            supp_name = normalise_supplier_name(row.get("SUPPLIER") or "")
            if code and supp_name and code not in seen_suppliers:
                seen_suppliers.add(code)
                existing = self.db.query(Supplier).filter_by(code=code).first()
                if existing:
                    skipped["suppliers"].append(
                        {"code": code, "name": supp_name, "reason": "Already exists"}
                    )
                else:
                    to_insert["suppliers"].append({"code": code, "name": supp_name})

        # --- build response -----------------------------------------------------
        return APIResponse.ok(
            data={
                "summary": {
                    "acc_parents_to_insert": len(to_insert["acc_parents"]),
                    "accounts_to_insert": len(to_insert["accounts"]),
                    "products_to_insert": len(to_insert["products"]),
                    "suppliers_to_insert": len(to_insert["suppliers"]),
                    "missing_account_refs": len(missing_account_refs),
                    "skipped_accounts": len(skipped["accounts"]),
                    "skipped_products": len(skipped["products"]),
                    "skipped_suppliers": len(skipped["suppliers"]),
                },
                "samples": {
                    "acc_parents": to_insert["acc_parents"][:20],
                    "accounts": to_insert["accounts"][:20],
                    "products": to_insert["products"][:20],
                    "suppliers": to_insert["suppliers"][:20],
                    "missing_accounts": missing_account_refs[:20],
                    "skipped_accounts": skipped["accounts"][:10],
                    "skipped_products": skipped["products"][:10],
                    "skipped_suppliers": skipped["suppliers"][:10],
                },
            }
        )
