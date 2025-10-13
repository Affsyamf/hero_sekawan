from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from datetime import datetime
from io import BytesIO
import pandas as pd
import math, re
from collections import defaultdict
from fastapi import HTTPException
from openpyxl import load_workbook

from app.models import (
    Product,
    Supplier, 
    Purchasing,
    PurchasingDetail
)

from app.utils.normalise import normalise_product_name
from app.utils.safe_parse import safe_str, safe_date, safe_number
from app.utils.cost_helper import update_avg_cost_for_products, refresh_product_avg_cost

class OpeningBalanceImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def get_or_create_system_supplier(self):
        supplier = self.db.query(Supplier).filter_by(code="SYSTEM").first()
        if not supplier:
            supplier = Supplier(code="SYSTEM", name="System Opening Balance")
            self.db.add(supplier)
            self.db.commit()
        return supplier

    def _run(self, file: UploadFile):
        contents: bytes = file.file.read()

        system_supplier = self.get_or_create_system_supplier()
    
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
        self.db.add(purchasing)
        self.db.flush()
        
        skipped = 0
        skipped_products = []
        added = 0
        affected_products = set()
        
        for _, row in df.iterrows():
            prod_name = safe_str(normalise_product_name(row.get("NAMA BARANG")))
            if prod_name is None:
                continue
            
            end_qty = safe_number(row.get("FISIK"))

            if end_qty == None or end_qty == 0:
                skipped += 1
                skipped_products.append({ "name": prod_name, "reason": "Saldo akhir 0"})
                continue

            price = safe_number(row.get("JUMLAH FISIK"))

            init_qty = safe_number(row.get("SALDO AWAL"))

            unit_price = price / end_qty
            dpp = unit_price * init_qty
            ppn = dpp * 0.11
            
            product = self.db.query(Product).filter_by(name=prod_name).first()
            if not product:
                print(f"⚠️ Product not found: {prod_name}, skipping")
                skipped += 1
                skipped_products.append({"name": prod_name, "reason": "Product not found"})
                continue
            
            detail = PurchasingDetail(
                product=product,
                purchasing=purchasing,
                quantity=init_qty,
                price=unit_price,
                discount=0.0,
                ppn=ppn,
                pph=0.0,
                dpp=dpp,
                tax_no=None,
                exchange_rate=0.0,
            )
            self.db.add(detail)
            affected_products.add(product.id)
            added += 1

        self.db.commit()

        if affected_products:
            update_avg_cost_for_products(self.db.connection(), list(affected_products))

        refresh_product_avg_cost(self.db)
        

        return {
            "skipped": skipped,
            "skipped_products": skipped_products,
            "added": added
        }