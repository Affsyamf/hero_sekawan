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
    Stock_Movement, 
    Stock_Movement_Detail
)
from app.utils.safe_parse import safe_str, safe_date, safe_number
from app.utils.cost_helper import get_avg_cost_for_product

class LapChemicalImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def _run(self, file: UploadFile):
        contents: bytes = file.file.read()

        df = pd.read_excel(
            BytesIO(contents),
            sheet_name="CHEMICAL",
            header=4
        )
        df = df.iloc[:, :-2]  # drop trailing junk cols

        inserted = {"movements": 0, "details": 0, "skipped": 0, "errors": []}
        movements_map = {}  # (code, date) -> Stock_Movement

        for idx, row in df.iterrows():
            excel_row = idx + 5  # offset since header=4

            code = safe_str(row.get("NOBUKTI"))
            tanggal = safe_date(row.get("TANGGAL"))
            qty = safe_number(row.get("QTY"))
            nama_brg = safe_str(row.get("NAMABRG"))

            # --- Required fields check ---
            if not code or not tanggal or qty is None or not nama_brg:
                inserted["skipped"] += 1
                continue

            # --- find product ---
            product = self.db.query(Product).filter_by(name=nama_brg.upper()).first()
            if not product:
                inserted["errors"].append(
                    {
                        "row": excel_row, 
                        "reason": f"product not found: {nama_brg}", 
                        "code": code, 
                        "qty": qty
                    }
                )
                continue

            # --- fetch cached avg cost ---
            unit_cost = get_avg_cost_for_product(self.db, product.id)
            if unit_cost is None:
                inserted["errors"].append({
                    "row": excel_row,
                    "reason": f"no cached avg cost for product: {nama_brg}",
                    "product_id": product.id,
                    "code": code,
                    "qty": qty
                })
                inserted["skipped"] += 1
                continue

            # --- reuse or create Stock_Movement ---
            key = (code, tanggal)
            if key not in movements_map:
                movement = Stock_Movement(date=tanggal, code=code)
                self.db.add(movement)
                self.db.flush()  # ensure movement.id available
                movements_map[key] = movement
                inserted["movements"] += 1
            else:
                movement = movements_map[key]

            # --- create Stock_Movement_Detail ---
            detail = Stock_Movement_Detail(
                quantity=qty,
                product_id=product.id,
                stock_movement_id=movement.id,
                unit_cost_used=unit_cost,
            )
            self.db.add(detail)
            inserted["details"] += 1

        return inserted