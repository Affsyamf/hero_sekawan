# utils/response.py
import math
from typing import Any, Optional, Dict, List, Callable
from fastapi.responses import JSONResponse
from fastapi import status
from sqlalchemy import func
from sqlalchemy.orm import Query

from utils.datatable.request import ListRequest


class APIResponse:
    """
    Custom API Response class untuk konsistensi response format
    Supports both: APIResponse(status_code=404, message="Not found") and APIResponse.not_found("Not found")
    """

    def __init__(
            self,
            status_code: int = 200,
            message: str = "Operation Successful",
            data: Any = None,
            success: Optional[bool] = None,
            errors: Optional[List[str]] = None,
            meta: Optional[Dict[str, Any]] = None
    ):
        """
        Constructor untuk direct instantiation
        Usage: APIResponse(status_code=404, message="Client not found")
        """
        # Auto determine success based on status code if not explicitly set
        if success is None:
            success = 200 <= status_code < 400

        response_data = {
            "success": success,
            "message": message,
        }

        if data is not None:
            response_data["data"] = data

        if errors:
            response_data["errors"] = errors

        if meta:
            response_data["meta"] = meta

        self.response = JSONResponse(
            status_code=status_code,
            content=response_data
        )

    def __call__(self):
        """Make it callable to return JSONResponse"""
        return self.response

    @staticmethod
    def _create_response(
            success: bool,
            message: str,
            data: Any = None,
            status_code: int = 200,
            errors: Optional[List[str]] = None,
            meta: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """Base method untuk create response (for static methods)"""
        response_data = {
            "success": success,
            "message": message,
        }

        if data is not None:
            response_data["data"] = data

        if errors:
            response_data["errors"] = errors

        if meta:
            response_data["meta"] = meta

        return JSONResponse(
            status_code=status_code,
            content=response_data
        )

    # ===== SUCCESS RESPONSES =====

    @classmethod
    def ok(
            cls,
            message: str = "Operation Successful",
            data: Any = None,
            meta: Optional[Dict[str, Any]] = None
    ) -> JSONResponse:
        """200 OK Response"""
        return cls._create_response(
            success=True,
            message=message,
            data=data,
            status_code=status.HTTP_200_OK,
            meta=meta
        )

    @classmethod
    def ok_but_failed(
            cls,
            message: str = "Operation Unsuccessful",
            data: Any = None,
            errors: Optional[List[str]] = None
    ) -> JSONResponse:
        """200 OK tapi operasi gagal (business logic failure)"""
        return cls._create_response(
            success=False,  # ❌ Operation failed
            message=message,
            data=data,
            status_code=status.HTTP_200_OK,  # ✅ HTTP OK
            errors=errors
        )

    @classmethod
    def created(
            cls,
            message: str = "Resource created successfully",
            data: Any = None
    ) -> JSONResponse:
        """201 Created Response"""
        return cls._create_response(
            success=True,
            message=message,
            data=data,
            status_code=status.HTTP_201_CREATED
        )

    # ===== ERROR RESPONSES =====

    @classmethod
    def bad_request(
            cls,
            message: str = "Bad request",
            errors: Optional[List[str]] = None
    ) -> JSONResponse:
        """400 Bad Request Response"""
        return cls._create_response(
            success=False,
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            errors=errors
        )

    @classmethod
    def unauthorized(
            cls,
            message: str = "Unauthorized access"
    ) -> JSONResponse:
        """401 Unauthorized Response"""
        return cls._create_response(
            success=False,
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )

    @classmethod
    def forbidden(
            cls,
            message: str = "Access forbidden"
    ) -> JSONResponse:
        """403 Forbidden Response"""
        return cls._create_response(
            success=False,
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )

    @classmethod
    def not_found(
            cls,
            message: str = "Resource not found"
    ) -> JSONResponse:
        """404 Not Found Response"""
        return cls._create_response(
            success=False,
            message=message,
            status_code=status.HTTP_404_NOT_FOUND
        )

    @classmethod
    def conflict(
            cls,
            message: str = "Resource conflict",
            errors: Optional[List[str]] = None
    ) -> JSONResponse:
        """409 Conflict Response"""
        return cls._create_response(
            success=False,
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            errors=errors
        )

    @classmethod
    def validation_error(
            cls,
            message: str = "Validation failed",
            errors: Optional[List[str]] = None
    ) -> JSONResponse:
        """422 Validation Error Response"""
        return cls._create_response(
            success=False,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            errors=errors
        )

    @classmethod
    def internal_error(
            cls,
            message: str = "Internal server error"
    ) -> JSONResponse:
        """500 Internal Server Error Response"""
        return cls._create_response(
            success=False,
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # ===== PAGINATION RESPONSE =====

    @classmethod
    def paginated(cls, query: Query, request: ListRequest, serializer: Callable[[Any], Dict] = None,
                  message: str = "Data retrieved successfully"):
        """
            Paginate Response.

        Args:
            query: SQLAlchemy Query object
            request: ListRequest object dengan pagination info
            serializer: Optional function untuk serialize data.
                       Jika None, akan auto-serialize semua non-private attributes
            message: Optional message

        Returns:
            JSONResponse dengan struktur standar dan pagination di meta

        Examples:
            # Auto-serialize (mengembalikan semua fields dari model)
            return APIResponse.paginated(query, request)

            # Dengan lambda untuk custom formatting
            return APIResponse.paginated(query, request, lambda client: {
                "id": client.id,
                "name": client.name,
                "email": client.email,
                "phone": client.phone,
                "full_info": f"{client.name} ({client.email})",
                "status": "active" if client.is_active else "inactive"
            })
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
        else:
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

        # Calculate pagination meta
        total_pages = math.ceil(total / request.page_size) if request.page_size > 0 else 0

        meta = {
            "pagination": {
                "page": request.page,
                "page_size": request.page_size,
                "total": total,
                "total_pages": total_pages,
                "has_next": request.page < total_pages,
                "has_prev": request.page > 1,
                "from": (request.page - 1) * request.page_size + 1 if data else 0,
                "to": min(request.page * request.page_size, total)
            }
        }

        return cls.ok(
            message=message,
            data=data,
            meta=meta
        )
