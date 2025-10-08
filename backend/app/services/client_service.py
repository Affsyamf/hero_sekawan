from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.client_input_models import ClientCreate, ClientUpdate
from app.services.common.audit_logger import AuditLoggerService
from core.database import Session, get_db
from app.models.master import Client, StockMovement, Payment
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse

class ClientService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_client(self, request: ListRequest):
        client = self.db.query(Client)

        if request.search:
            like = f"%{request.search}%"
            client = client.filter(
                or_(
                    Client.name.ilike(like),
                    Client.phone.ilike(like),
                    Client.email.ilike(like),
                    Client.address.ilike(like),
                )
            ).order_by(Client.id)

        return APIResponse.paginated(client, request)

    def get_client(self, client_id: int):
        client = self.db.query(Client).filter(Client.id == client_id).first()

        if not client:
            raise HTTPException(status_code=404, detail=f"Client ID '{client_id}' not found.")

        items = []
        for sm in sorted(client.stock_movement, key=lambda x: x.date or datetime.max):
            for it in (sm.items or []):
                items.append({
                    "warehouse_id": sm.warehouse_id,
                    "warehouse_name": sm.warehouse.name if sm.warehouse else None,
                    "product_id": it.product_id,
                    "product_name": it.product.name if it.product else None,
                    "quantity": it.quantity,
                    "date": sm.date.isoformat() if sm.date else None,
                    "price": it.price,
                })

        response = {
            "id": client.id,
            "name": client.name,
            "phone": client.phone,
            "email": client.email,
            "address": client.address,
            "items": items,
        }

        return APIResponse.ok(data=response)

    def create_client(self, request: ClientCreate):
        client = Client(**request.model_dump())
        self.db.add(client)

        # Populate client.id without committing the whole transaction
        # self.db.flush()

        return APIResponse.created()

    def update_client(self, client_id: int, request: ClientUpdate):
        update_data = request.model_dump(exclude_unset=True)

        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail=f"Client ID '{client_id}' not found.")

        old_data = {k: getattr(client, k) for k in update_data.keys()}

        result = (
            self.db.query(Client)
                .filter(Client.id == client_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            raise HTTPException(status_code=404, detail=f"Client ID '{client_id}' not found.")
        
        # Add to log
        AuditLoggerService(self.db).log_update(
            table_name=Client.__tablename__,
            record_id=client_id,
            old_data=old_data,
            new_data=update_data,
            changed_by="system"  # harusnya ambil dari current_user
        )

        return APIResponse.ok(f"Client ID '{client_id}' updated.")

    def delete_client(self, client_id: int):
        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail=f"Client ID '{client_id}' not found.")

        # Cek relasi: jika sudah dipakai di transaksi/pembayaran, tolak hapus
        sm_count = self.db.query(StockMovement).filter(StockMovement.client_id == client_id).count()
        pay_count = self.db.query(Payment).filter(Payment.client_id == client_id).count()

        if sm_count > 0 or pay_count > 0:
            # kembalikan info detail agar frontend bisa tampilkan popup
            msg = (
                "Client tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{sm_count} Stock Movement, {pay_count} Payment."
            )
            # pakai ValueError agar ditangkap router dan diubah ke HTTP 409
            raise HTTPException(status_code=409, detail=msg)
        
        old_data = {
            key: value
            for key, value in vars(client).items()
            if not key.startswith("_")
        }
        
        # Add to log
        AuditLoggerService(self.db).log_delete(
            table_name=Client.__tablename__,
            record_id=client_id,
            old_data=old_data,
            changed_by="system"  # harusnya ambil dari current_user
        )

        self.db.delete(client)

        return APIResponse.ok(f"Client ID '{client_id}' deleted.")
