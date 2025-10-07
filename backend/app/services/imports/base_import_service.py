from fastapi import UploadFile, HTTPException
from io import BytesIO
import pandas as pd

class BaseImportService:
    def __init__(self, db):
        self.db = db
        self.errors = []
        self.inserted = 0
        self.skipped = 0

    def read_excel(self, file: UploadFile) -> pd.DataFrame:
        """Default reader (simple one-sheet flat file). Override if needed."""
        try:
            return pd.read_excel(BytesIO(file.file.read()))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid Excel: {e}")

    def log_error(self, row, msg):
        self.errors.append({"row": row, "error": msg})

    def summary(self):
        return {
            "inserted": self.inserted,
            "skipped": self.skipped,
            "errors": self.errors,
        }