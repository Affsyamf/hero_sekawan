from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from io import BytesIO
import pandas as pd
import math
from openpyxl import load_workbook

from app.models import (
    Design,
    DesignType
)

from app.utils.normalise import normalise_design_name, normalise_design_type
from app.utils.safe_parse import safe_str, safe_date, safe_number

class MasterDataLapCkImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def get_or_create_design_type(self, raw_value: str):
        normalized = normalise_design_type(raw_value)
        dtype = self.db.query(DesignType).filter_by(name=normalized).first()
        if not dtype:
            dtype = DesignType(name=normalized)
            self.db.add(dtype)
            self.db.flush()  # assign ID before commit
        return dtype

    def _run(self, file: UploadFile):
        contents: bytes = file.file.read()

        df = pd.read_excel(
            BytesIO(contents),
            sheet_name="TEMPLATE QTY",
            header=2,
            usecols="A:E"
        )

        seen = set()
        added, skipped, unknown = 0, 0, []
        

        for _, row in df.iterrows():
            opj = row.get("OPJ")
            if pd.isna(opj):
                continue  # skip rows with no OPJ

            code = normalise_design_name(str(row.get("DESIGN") or ""))
            type_raw = str(row.get("JENIS KAIN") or "")

            if not code or not type_raw:
                continue

            if code in seen:
                continue
            seen.add(code)

            dtype = self.get_or_create_design_type(type_raw)
            design = Design(code=code, type=dtype)
            added += 1
            self.db.add(design)

        return {
            "added": added,
            "skipped": skipped,
            "unknown_types": sorted(set(unknown))  # unique list of unknown types
        }
