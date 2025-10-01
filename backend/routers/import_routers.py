from fastapi import APIRouter, UploadFile, HTTPException, Depends, File, Query
from sqlalchemy.orm import Session
import json
import traceback, sys
from typing import List, Optional

from utils.deps import DB
from api.excel_import import harga_obat, lap_chemical, lap_pembelian, lap_ck
from api.excel_import.master_data import (master_data_design, master_data_lap_pembelian, master_data_product_code)

excel_import_router = APIRouter(prefix="/import", tags=["import"])

@excel_import_router.post("/harga-obat")
async def import_harga_obat(
    file: UploadFile,
    db: DB,
):
    name = (file.filename or "").lower()
    if not name.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")
    try:
        contents: bytes = await file.read()
        result = harga_obat.run(contents, db=db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import: {e}")
    
@excel_import_router.post("/lap-chemical")
async def import_lap_chemical(
    file: UploadFile,
    db: DB,
):
    name = (file.filename or "").lower()
    if not name.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")
    try:
        contents: bytes = await file.read()
        result = lap_chemical.run(contents, db=db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import: {e}")
    
@excel_import_router.post("/lap-pembelian")
async def import_lap_pembelian(
    file: UploadFile,
    db: DB,
):
    name = (file.filename or "").lower()
    if not name.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")
    try:
        contents: bytes = await file.read()
        result = lap_pembelian.run(contents, db=db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import: {e}")
    
@excel_import_router.post("/lap-ck")
async def import_lap_ck(
    file: UploadFile,
    db: DB,
):
    name = (file.filename or "").lower()
    if not name.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")
    try:
        contents: bytes = await file.read()
        result = lap_ck.run(contents, db=db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import: {e}")
    
#region Master Data
@excel_import_router.post("/master-data/lap-pembelian")
async def import_master(
    file: UploadFile,
    db: DB,
):
    name = (file.filename or "").lower()
    if not name.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")
    try:
        contents: bytes = await file.read()
        result = master_data_lap_pembelian.run(contents, db=db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import: {e}")
    
@excel_import_router.post("/master-data/product_code")
async def import_product(
    file: UploadFile,
    db: DB,
):
    name = (file.filename or "").lower()
    if not name.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")
    try:
        contents: bytes = await file.read()
        result = master_data_product_code.run(contents, db=db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import: {e}")
    
@excel_import_router.post("/master-data/design")
async def import_design(
    file: UploadFile,
    db: DB,
):
    name = (file.filename or "").lower()
    if not name.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")
    try:
        contents: bytes = await file.read()
        result = master_data_design.run(contents, db=db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import: {e}")
#endregion Master Data