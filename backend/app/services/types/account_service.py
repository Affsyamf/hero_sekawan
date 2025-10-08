from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.types_input_models import AccountCreate, AccountUpdate
from app.services.common.audit_logger import AuditLoggerService
from core.database import Session, get_db
from app.models import Account, Product
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class AccountService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_account(self, request: ListRequest):
        account = self.db.query(Account)

        if request.search:
            like = f"%{request.search}%"
            account = account.filter(
                or_(
                    Account.name.ilike(like),
                    Account.alias.ilike(like),
                )
            ).order_by(Account.id)

        return APIResponse.paginated(account, request)

    def get_account(self, account_id: int):
        account = self.db.query(Account).filter(Account.id == account_id).first()

        if not account:
            raise HTTPException(status_code=404, detail=f"Account ID '{account_id}' not found.")

        response = {
            "id": account.id,
            "name": account.name,
            "account_no": str(account.account_no) if account.account_no else None,
            "account_type": account.account_type.value if account.account_type else None,
            "alias": account.alias,
        }

        return APIResponse.ok(data=response)

    def create_account(self, request: AccountCreate):
        existing = self.db.query(Account).filter(Account.account_no == request.account_no).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Account number '{request.account_no}' already exists.")

        account = Account(**request.model_dump())
        self.db.add(account)

        return APIResponse.created()

    def update_account(self, account_id: int, request: AccountUpdate):
        update_data = request.model_dump(exclude_unset=True)

        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail=f"Account ID '{account_id}' not found.")

        if "account_no" in update_data:
            existing = self.db.query(Account).filter(
                Account.account_no == update_data["account_no"],
                Account.id != account_id
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Account number '{update_data['account_no']}' already exists.")

        old_data = {k: getattr(account, k) for k in update_data.keys()}

        result = (
            self.db.query(Account)
                .filter(Account.id == account_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            raise HTTPException(status_code=404, detail=f"Account ID '{account_id}' not found.")
        
        AuditLoggerService(self.db).log_update(
            table_name=Account.__tablename__,
            record_id=account_id,
            old_data=old_data,
            new_data=update_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Account ID '{account_id}' updated.")

    def delete_account(self, account_id: int):
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail=f"Account ID '{account_id}' not found.")

        product_count = self.db.query(Product).filter(Product.account_id == account_id).count()

        if product_count > 0:
            msg = (
                "Account tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{product_count} Product."
            )
            raise HTTPException(status_code=409, detail=msg)
        
        old_data = {
            key: value
            for key, value in vars(account).items()
            if not key.startswith("_")
        }
        
        AuditLoggerService(self.db).log_delete(
            table_name=Account.__tablename__,
            record_id=account_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(account)

        return APIResponse.ok(f"Account ID '{account_id}' deleted.")