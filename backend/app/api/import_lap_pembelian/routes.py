from fastapi import APIRouter, HTTPException, Depends, UploadFile

from app.schemas.input_models.types_input_models import AccountCreate, AccountUpdate
from app.utils.datatable.request import ListRequest
from app.services.types.account_service import AccountService
from app.utils.response import APIResponse
from app.services.import_lap_pembelian_service import ImportLapPembelianService

import_lap_pembelian_router = APIRouter(prefix="/import-lap-pembelian", tags=["Import Laporan Pembelian"])

@import_lap_pembelian_router.post("/upload")
def upload_excel(file: UploadFile, service: ImportLapPembelianService = Depends()):
    return service.upload_excel(file)

@import_lap_pembelian_router.post("/commit/{session_id}")
def commit_data(session_id: str, service: ImportLapPembelianService = Depends()):
    return service.commit_data(session_id)