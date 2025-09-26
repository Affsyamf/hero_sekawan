from fastapi import APIRouter, UploadFile, HTTPException, Depends, File, Query
from sqlalchemy.orm import Session
import json
import traceback, sys
from typing import List, Optional

from utils.deps import DB
from api.tmp import tmp_account

tmp_router = APIRouter(prefix="/tmp", tags=["tmp"])

@tmp_router.post("/master-data")
async def import_master(
    file: UploadFile,
    db: DB,
):
    name = (file.filename or "").lower()
    if not name.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")
    try:
        contents: bytes = await file.read()
        result = tmp_account.run(contents, db=db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import: {e}")

