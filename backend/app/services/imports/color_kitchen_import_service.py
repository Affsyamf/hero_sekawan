from fastapi import Depends, UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from datetime import datetime
from io import BytesIO
import pandas as pd
import math, re
from collections import defaultdict
from fastapi import HTTPException

from app.models import (
    ColorKitchenBatch,
    ColorKitchenBatchDetail,
    ColorKitchenEntry,
    ColorKitchenEntryDetail,
    Product,
    Design,
)

from app.utils.normalise import normalise_design_name, normalise_product_name
from app.utils.safe_parse import safe_str, safe_date, safe_number

SKIP_NAMES = {"0.4", "0.5", "0.6", "0.65"}

class ColorKitchenImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    # 🔹 Custom reader — overrides BaseImportService
    def read_excel(self, contents):
        header_rows = 6
        usecols = "A:BI"
        sheet_name = "TEMPLATE QTY"

        raw = pd.read_excel(
            BytesIO(contents),
            sheet_name=sheet_name,
            header=None,
            nrows=header_rows,
            usecols=usecols
        )

        def scalar(x):
            return str(x).strip() if pd.notna(x) else ""

        columns = []
        meta = []
        current_section = None

        for col_idx in range(len(raw.columns)):
            sec  = scalar(raw.iat[2, col_idx])  # row 3 (sections)
            sub  = scalar(raw.iat[3, col_idx])  # row 4
            name = scalar(raw.iat[4, col_idx])  # row 5

            if sec:
                current_section = sec  # force inheritance

            if col_idx < 5:
                flat = scalar(raw.iat[2, col_idx]) or f"col{col_idx}"
            else:
                parts = [p for p in [current_section, sub, name] if p]
                flat = "|".join(parts) if parts else f"col{col_idx}"

            # Prefer row 5 (name), fallback to sub or section
            if name:
                product_name = normalise_product_name(name)
            else:
                product_name = normalise_product_name(sub or current_section)

            role = "aux" if "AUXILIARIES" in (current_section or "").upper() else "dyestuff"
            is_paste_col = (normalise_product_name(name) == "JUMLAH PASTA") or \
                        (normalise_product_name(sub) == "JUMLAH PASTA")

            meta.append({
                "idx": col_idx,
                "flat": flat,
                "section": current_section,
                "sub": sub,
                "name": name,
                "product_name": product_name,
                "role": role,
                "is_paste_col": is_paste_col
            })
            columns.append(flat)

        df = pd.read_excel(
            BytesIO(contents),
            sheet_name=sheet_name,
            header=header_rows,
            usecols=usecols
        )
        df.columns = columns

        return df, meta

    def save_to_db(self, parsed):
        missing_products = set()
        missing_designs = set()

        # ----------- validation pass -----------
        for b in parsed["batches"]:
            # batch-level products
            for d in b.get("details", []):
                product = self.db.query(Product).filter_by(name=d["product_name"]).first()
                if not product:
                    missing_products.add(d["product_name"])

            # entries
            for e in b.get("entries", []):
                design = self.db.query(Design).filter(Design.code == normalise_design_name(e["design"])).first()
                if not design:
                    missing_designs.add(e["design"])

                for d in e.get("details", []):
                    product = self.db.query(Product).filter_by(name=d["product_name"]).first()
                    if not product:
                        missing_products.add(d["product_name"])

        # If anything missing → abort before any insert
        if missing_products or missing_designs:
            msg = []
            if missing_products:
                safe_products = sorted([p for p in missing_products if p])
                if safe_products:
                    msg.append(f"Missing products: {', '.join(safe_products)}")
            if missing_designs:
                safe_designs = sorted([d for d in missing_designs if d])
                if safe_designs:
                    msg.append(f"Missing designs: {', '.join(safe_designs)}")

            if msg:  # ✅ only raise if something meaningful exists
                raise ValueError(" | ".join(msg))
            
        # ----------- insert pass -----------
        for b in parsed["batches"]:
            batch = ColorKitchenBatch(
                code=b["code"],
                date=datetime.fromisoformat(b["date"]) if b["date"] else datetime.utcnow(),
            )
            self.db.add(batch)

            # batch-level details
            for d in b.get("details", []):
                product = self.db.query(Product).filter_by(name=d["product_name"]).first()
                detail = ColorKitchenBatchDetail(
                    product=product,
                    quantity=d["quantity"],
                    batch=batch,
                )
                self.db.add(detail)

            # entries
            for e in b.get("entries", []):
            # skip empty OPJ or design (no code or design_id)
                if not e.get("code"):
                    # print(f"⚠️ Skipping entry with no code in batch {b['code']}")
                    continue

                design = self.db.query(Design).filter_by(code=normalise_design_name(e["design"])).first()
                if not design:
                    # print(f"⚠️ Skipping entry with no matching design: {e['design']}")
                    continue

                entry = ColorKitchenEntry(
                    code=e["code"],
                    date=datetime.fromisoformat(e["date"]) if e["date"] else datetime.utcnow(),
                    rolls=e.get("rolls") or 0,
                    paste_quantity=e.get("paste_quantity") or 0,
                    design=design,
                    batch=batch,
                )
                self.db.add(entry)

                for d in e.get("details", []):
                    product = self.db.query(Product).filter_by(name=d["product_name"]).first()
                    detail = ColorKitchenEntryDetail(
                        product=product,
                        quantity=d["quantity"],
                        color_kitchen_entry=entry,
                    )
                    self.db.add(detail)

        self.db.commit()

        return {"missing_products": parsed, "missing_designs": []}

    async def _run(self, file: UploadFile):
        contents: bytes = file.file.read()
    
        df, meta = self.read_excel(contents)
        parent_cols = ["OPJ", "DESIGN", "JENIS KAIN", "ROLL", "TGL"]

        batches = []
        current_batch = None
        batch_agg = {}
        skipped_rows = []
        
        # Group metadata by product_name → merge duplicates
        grouped_meta = defaultdict(list)
        for m in meta:
            grouped_meta[m["product_name"]].append(m)

        def finalize_batch():
            nonlocal current_batch, batch_agg
            if current_batch:
                current_batch["details"] = [
                    {"product_name": p, "quantity": qty}
                    for p, qty in batch_agg.items() if qty and qty != 0
                ]
                batches.append(current_batch)
            current_batch = None
            batch_agg = {}

        for r_idx, row in df.iterrows():
            opj         = safe_str(row.get("OPJ"))
            design_name = safe_str(row.get("DESIGN"))
            jenis_kain  = safe_str(row.get("JENIS KAIN"))
            rolls       = safe_number(row.get("ROLL"))
            tgl         = safe_date(row.get("TGL"))

            if not any([opj, design_name]):
                finalize_batch()
                skipped_rows.append({"row": r_idx + 1, "reason": "empty separator"})
                continue

            if current_batch is None:
                current_batch = {
                    "code": f"BATCH-{opj}-{tgl}",
                    "date": tgl.isoformat() if tgl else None,
                    "entries": [],
                    "details": [],
                }

            entry = {
                "code": opj,
                "date": tgl.isoformat() if tgl else None,
                "design": design_name,
                "jenis_kain": jenis_kain,
                "rolls": rolls,
                "paste_quantity": 0.0,
                "details": [],
            }
            current_batch["entries"].append(entry)

            aux_accum = {}
            
            # process by grouped product_name
            for pname, metas in grouped_meta.items():
                if pname in SKIP_NAMES or not pname:
                    continue
                total_val = 0.0
                for m in metas:
                    if m["flat"] in parent_cols:
                        continue
                    val = safe_number(row[m["idx"]])
                    
                    if val is not None and val != 0:
                        total_val += val

                if total_val == 0:
                    continue
                
                sample_meta = metas[0]  # use first for role / flags
                if sample_meta["role"] == "aux":

                    if sample_meta["is_paste_col"]:
                        entry["paste_quantity"] += total_val
                    else:
                        aux_accum[pname] = aux_accum.get(pname, 0.0) + total_val
                else:
                    batch_agg[pname] = batch_agg.get(pname, 0.0) + total_val
            for pname, qty in aux_accum.items():
                entry["details"].append({"product_name": pname, "quantity": qty})
        
        finalize_batch()
        ret = self.save_to_db({"batches": batches})

        return {
            "missing_products": ret,
        }
    
        