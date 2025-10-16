from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from datetime import datetime
from io import BytesIO
import pandas as pd

from app.models import (
    Product,
    StockOpname, 
    StockOpnameDetail,
    Ledger
)

from app.models.ledger import LedgerLocation, LedgerRef

from app.utils.normalise import normalise_product_name
from app.utils.safe_parse import safe_str, safe_date, safe_number
from app.utils.response import APIResponse

class StockOpnameChemicalImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def _run(self, file: UploadFile):
        contents: bytes = file.file.read()

        xls = pd.ExcelFile(BytesIO(contents))
        start_date = datetime(2025,7,31)
        
        df = pd.read_excel(xls, sheet_name="GUDANG BESAR", header=4)
        df = df[df["NO"].notna()]

        so_code = "SO-" + start_date.strftime("%Y%m%d")
        
        stock_opname = StockOpname(
            date=start_date,
            code=so_code,
        )
        self.db.add(stock_opname)
        self.db.flush()
        
        skipped = 0
        skipped_products = []
        added = 0
        
        for _, row in df.iterrows():
            prod_name = safe_str(normalise_product_name(row.get("NAMA BARANG")))
            if prod_name is None:
                continue

            system_qty = safe_number(row.get("SALDO AWAL")) + safe_number(row.get("MUTASI MASUK")) - safe_number(row.get("MUTASI KELUAR"))
            physical_qty = safe_number(row.get("FISIK"))

            product = self.db.query(Product).filter_by(name=prod_name).first()
            if not product:
                print(f"⚠️ Product not found: {prod_name}, skipping")
                skipped += 1
                skipped_products.append(prod_name)
                continue
            
            detail = StockOpnameDetail(
                product=product,
                system_quantity=system_qty,
                physical_quantity=physical_qty,
                stock_opname=stock_opname
            )
            self.db.add(detail)

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

                    self.db.add(ledger_entry_kitchen)

                self.db.add(ledger_entry)
            added += 1

        self.db.commit()

        return {
            "skipped": skipped,
            "skipped_products": skipped_products,
            "added": added
        }
    
    def preview(self, file: UploadFile):
        contents: bytes = file.file.read()
        xls = pd.ExcelFile(BytesIO(contents))
        start_date = datetime(2025, 7, 31)

        df = pd.read_excel(xls, sheet_name="GUDANG BESAR", header=4)
        df = df[df["NO"].notna()]

        preview_rows = []
        skipped_products = []
        added = 0

        for _, row in df.iterrows():
            prod_name = safe_str(normalise_product_name(row.get("NAMA BARANG")))
            if not prod_name:
                continue

            system_qty = safe_number(row.get("SALDO AWAL")) + safe_number(row.get("MUTASI MASUK")) - safe_number(row.get("MUTASI KELUAR"))
            physical_qty = safe_number(row.get("FISIK"))
            difference = (system_qty or 0) - (physical_qty or 0)

            product = self.db.query(Product).filter_by(name=prod_name).first()
            if not product:
                skipped_products.append({"name": prod_name, "reason": "Product not found"})
                continue

            added += 1

            # Decide movement summary for preview
            if difference == 0:
                movement_desc = "MATCH"
            elif difference > 0:
                movement_desc = f"OUT {abs(difference)} from Gudang"
            else:
                movement_desc = f"IN {abs(difference)} to Gudang (OUT from Kitchen)"

            preview_rows.append({
                "product": prod_name,
                "system_qty": system_qty,
                "physical_qty": physical_qty,
                "difference": difference,
                "movement": movement_desc
            })

        return APIResponse.ok(
            data={
                "summary": {
                    "total_rows": len(df),
                    "valid_products": added,
                    "skipped_products": len(skipped_products),
                },
                "preview_rows": preview_rows[:50],
                "skipped_sample": skipped_products[:50],
            }
        )