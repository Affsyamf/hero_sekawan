from datetime import datetime
from app.models.types import AccountParent
from app.models import AccountParent
from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.types_input_models import AccountCreate, AccountUpdate
from app.core.database import Session, get_db
from app.models import Account, Product
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class AccountService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_account(self, request: ListRequest):
        account = self.db.query(Account).join(Account.parent)

        if request and request.q:
            like = f"%{request.q}%"
            account = account.filter(
                or_(
                    Account.name.ilike(like),
                )
            ).order_by(Account.id)

        return APIResponse.ok(data=[
            {
                "id": a.id,
                "name": a.name,
                "account_no": str(a.parent.account_no) if a.parent and a.parent.account_no else None,
            }
            for a in account.all()
        ])

    def get_account(self, account_id: int):
        account = self.db.query(Account).join(Account.parent).filter(Account.id == account_id).first()

        if not account:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")

        response = {
            "id": account.id,
            "name": account.name,
            "account_no": str(account.parent.account_no) if account.parent.account_no else None,
            "account_type": account.account_type.value if account.account_type else None,
            "alias": account.alias,
            "products": [{
                    "id": product.id,
                    "code": product.code,
                    "name": product.name,
                    "name": product.name,
            } for product in account.products] if account.products else []
        }

        return APIResponse.ok(data=response)

    def create_account(self, request: AccountCreate):
        try:
            # Pastikan parent account ada
            parent = self.db.query(AccountParent).filter(AccountParent.id == request.parent_id).first()
            if not parent:
                return APIResponse.not_found(message=f"Parent account ID '{request.parent_id}' not found.")

            # Buat account baru (hanya field yang ada di model Account)
            account = Account(name=request.name, parent_id=request.parent_id)
            self.db.add(account)
            self.db.commit()
            self.db.refresh(account)

            return APIResponse.created(
                message="Account created successfully",
                data={"id": account.id, "name": account.name, "parent_id": account.parent_id}
            )
        except Exception as e:
            # log error supaya bisa dilihat di terminal
            print("❌ Error creating account:", e)
            return APIResponse.internal_error(message="Failed to create account", error_detail=str(e))

    def update_account(self, account_id: int, request: AccountUpdate):
        update_data = request.model_dump(exclude_unset=True)

        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")

        if "account_no" in update_data:
            existing = self.db.query(Account).filter(
                Account.account_no == update_data["account_no"],
                Account.id != account_id
            ).first()
            if existing:
                return APIResponse.conflict(message=f"Account number '{update_data['account_no']}' already exists.")

        result = (
            self.db.query(Account)
                .filter(Account.id == account_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")

        return APIResponse.ok(f"Account ID '{account_id}' updated.")

    def delete_account(self, account_id: int):
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")

        product_count = self.db.query(Product).filter(Product.account_id == account_id).count()

        if product_count > 0:
            msg = (
                "Account tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{product_count} Product."
            )
            return APIResponse.conflict(message=msg)

        self.db.delete(account)

        return APIResponse.ok(f"Account ID '{account_id}' deleted.")