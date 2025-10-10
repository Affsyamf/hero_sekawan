from typing import Any, Dict, Callable

from sqlalchemy.orm import Query
from sqlalchemy.sql import func

from app.utils.datatable.request import ListRequest
from app.utils.datatable.response import ListResponse


# Helper untuk query pagination
def paginate(query: Query, request: ListRequest, serializer: Callable[[Any], Dict] = None) -> ListResponse:
    """
        Paginate query dengan opsi serializer.

    Args:
        query: SQLAlchemy Query object
        request: ListRequest object dengan pagination info
        serializer: Optional function untuk serialize data.
                   Jika None, akan auto-serialize semua non-private attributes

    Returns:
        ListResponse dengan data yang sudah di-paginate

    Examples:
        # Auto-serialize (mengembalikan semua fields dari model)
        paginate(query, request)

        # Dengan lambda untuk custom formatting
        paginate(query, request, lambda client: {
            "id": client.id,
            "name": client.name,
            "email": client.email,
            "phone": client.phone,
            "full_info": f"{client.name} ({client.email})",
            "status": "active" if client.is_active else "inactive"
        })

        # Dengan function untuk logic yang kompleks
        def format_client(client):
            return {
                "id": client.id,
                "display_name": client.name or f"Client #{client.id}",
                "contact_methods": [
                    {"type": "email", "value": client.email} if client.email else None,
                    {"type": "phone", "value": client.phone} if client.phone else None
                ],
                "has_complete_profile": all([client.name, client.email, client.phone])
            }

        paginate(query, request, format_client)
    """

    # Hitung total records
    total = query.order_by(None).with_entities(func.count()).scalar() or 0

    # Ambil data dengan pagination
    items = (
        query
        .offset(request.offset)
        .limit(request.page_size)
        .all()
    )

    # Serialize data
    if serializer:
        # Gunakan custom serializer (lambda atau function)
        data = [serializer(item) for item in items]
        return ListResponse(data, total, request.page, request.page_size)

    # Auto-serialize: ambil semua non-private attributes dari model
    data = []
    for item in items:
        # Untuk SQLAlchemy model objects
        if hasattr(item, '__dict__'):
            row = {
                key: value
                for key, value in item.__dict__.items()
                if not key.startswith('_')
            }
        else:
            # Untuk hasil query dengan specific columns (tuple/named tuple)
            if hasattr(item, '_asdict'):
                row = item._asdict()
            elif hasattr(item, 'keys'):
                row = dict(zip(item.keys(), item))
            else:
                # Fallback: convert tuple to dict dengan index
                row = {f"column_{i}": value for i, value in enumerate(item)}

        data.append(row)

    return ListResponse(data, total, request.page, request.page_size)
