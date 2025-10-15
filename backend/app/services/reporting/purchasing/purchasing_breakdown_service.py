# app/services/reporting/purchasing/purchasing_breakdown_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Purchasing, PurchasingDetail, Product, Account
from app.models.enum.account_enum import AccountType
from app.services.reporting.base_reporting_service import BaseReportService


class PurchasingBreakdownService(BaseReportService):
    """
    Service for multi-level Purchasing Breakdown:
    account_type → goods/service
    account_name → within selected account_type
    product → within selected account
    """

    def run_summary(self, filters):
        filters = self.normalize_filters(filters)
        return self._get_summary(filters)

    def run_detailed(self, filters, level: str, parent_type: str = None, parent_account_id: int = None):
        filters = self.normalize_filters(filters)
        return self._get_detailed(filters, level, parent_type, parent_account_id)

    # --------------------------------------------------
    #  LEVEL 1 — Summary by account_type
    # --------------------------------------------------
    def _get_summary(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        q = (
            db.query(
                Account.account_type.label("type"),
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price).label("total_value"),
            )
            .select_from(PurchasingDetail)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .group_by(Account.account_type)
            .order_by(Account.account_type)
        )

        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)

        rows = q.all()

        # Ensure both goods and service are always present
        values = {r.type: float(r.total_value or 0) for r in rows}
        data = []
        for t in ["goods", "service"]:
            data.append({
                "label": t,
                "value": values.get(t, 0.0),
            })

        total = sum(d["value"] for d in data)
        for d in data:
            d["percentage"] = round((d["value"] / total) * 100, 2) if total else 0.0

        return {"level": "account_type", "data": data}

    
    
    # def _get_summary(self, filters):
    #     db: Session = self.db
    #     start_date = filters.get("start_date")
    #     end_date = filters.get("end_date")

    #     q = (
    #         db.query(
    #             Account.account_type.label("type"),
    #             func.sum(PurchasingDetail.quantity * PurchasingDetail.price).label("total_value"),
    #         )
    #         .join(Product, Product.id == PurchasingDetail.product_id)
    #         .join(Account, Account.id == Product.account_id)
    #         .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
    #         .group_by(Account.account_type)
    #         .order_by(Account.account_type)
    #     )

    #     if start_date:
    #         q = q.filter(Purchasing.date >= start_date)
    #     if end_date:
    #         q = q.filter(Purchasing.date <= end_date)

    #     rows = q.all()
    #     data = [{"label": r.type or "unknown", "value": float(r.total_value or 0)} for r in rows]

    #     total = sum(d["value"] for d in data)
    #     for d in data:
    #         d["percentage"] = round((d["value"] / total) * 100, 2) if total else 0.0

    #     return {"level": "account_type", "data": data}

    # --------------------------------------------------
    #  LEVEL 2–3 — Drilldown by account_type → account → product
    # --------------------------------------------------
    def _get_detailed(self, filters, level: str, parent_type: str = None, parent_account_id: int = None):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if level == "account_type":
            # Drilldown: account_type → account_name
            q = (
                db.query(
                    Account.id.label("account_id"),
                    Account.name.label("account_name"),
                    func.sum(PurchasingDetail.quantity * PurchasingDetail.price).label("total_value"),
                )
                .join(Product, Product.id == PurchasingDetail.product_id)
                .join(Account, Account.id == Product.account_id)
                .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
                .filter(Account.account_type == parent_type)
                .group_by(Account.id, Account.name)
                .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price).desc())
            )

        elif level == "account":
            # Drilldown: account → product
            q = (
                db.query(
                    Product.name.label("product"),
                    func.sum(PurchasingDetail.quantity).label("total_qty"),
                    func.sum(PurchasingDetail.quantity * PurchasingDetail.price).label("total_value"),
                )
                .join(Product, Product.id == PurchasingDetail.product_id)
                .join(Account, Account.id == Product.account_id)
                .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
                .filter(Account.id == parent_account_id)
                .group_by(Product.name)
                .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price).desc())
            )
        else:
            raise ValueError("Invalid level. Must be 'account_type' or 'account'.")

        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)

        rows = q.all()
        data = []

        if level == "account_type":
            # Aggregation by account (child of goods/service)
            data = [
                {
                    "account_id": r.account_id,
                    "label": r.account_name,
                    "value": float(r.total_value or 0),
                }
                for r in rows
            ]
        else:  # level == "account"
            # Aggregation by product
            data = [
                {
                    "label": r.product,
                    "qty": float(r.total_qty or 0),
                    "value": float(r.total_value or 0),
                }
                for r in rows
            ]

        # Compute percentages
        total = sum(d["value"] for d in data)
        for d in data:
            d["percentage"] = round((d["value"] / total) * 100, 2) if total else 0.0

        return {
            "level": level,
            "parent_type": parent_type,
            "parent_account_id": parent_account_id,
            "data": data,
        }
