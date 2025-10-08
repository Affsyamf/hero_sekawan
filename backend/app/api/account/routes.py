from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.types_input_models import AccountCreate, AccountUpdate
from app.utils.datatable.request import ListRequest
from app.services.types.account_service import AccountService
from app.utils.response import APIResponse

account_router = APIRouter(prefix="/account", tags=["account"])

@account_router.get("/search")
def search_accounts(request: ListRequest = Depends(), service: AccountService = Depends()):
    return service.list_account(request=request)

@account_router.get("/{account_id}")
def get_account_by_id(account_id: int, service: AccountService = Depends()):
    return service.get_account(account_id=account_id)

@account_router.post("/")
def create_account(request: AccountCreate, service: AccountService = Depends()):
    try:
        return service.create_account(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create account", error_detail=str(e))

@account_router.put("/{account_id}")
def update_account_by_id(account_id: int, request: AccountUpdate, service: AccountService = Depends()):
    try:
        return service.update_account(account_id, request)
    except HTTPException as e:
        return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update account", error_detail=str(e))

@account_router.delete("/{account_id}")
def delete_account_by_id(account_id: int, service: AccountService = Depends()):
    try:
        return service.delete_account(account_id)
    except HTTPException as e:
        return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete account", error_detail=str(e))