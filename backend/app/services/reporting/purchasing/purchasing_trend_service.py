from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import timedelta
from app.models import Purchasing, PurchasingDetail, Product, Account
from app.services.reporting.base_reporting_service import BaseReportService


class PurchasingTrendService(BaseReportService):
    """
    Service for generating Purchasing Trend data.
    Supports: daily, weekly, monthly, yearly granularity.
    Returns total + goods/service breakdown + week range.
    """

    def run(self, filters):
        filters = self.normalize_filters(filters)
        return self._get_trend(filters)

    # ------------------------------------------------------
    # internal trend logic
    # ------------------------------------------------------
    def _get_trend(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")
        account_type = filters.get("account_type")
        granularity = (filters.get("granularity") or "monthly").lower()

        # Determine SQL trunc unit & date format
        if granularity == "yearly":
            trunc_unit = "year"
            fmt = "%Y"
        elif granularity == "weekly":
            trunc_unit = "week"
            fmt = "%Y-W%W"
        elif granularity == "daily":
            trunc_unit = "day"
            fmt = "%Y-%m-%d"
        else:
            trunc_unit = "month"
            fmt = "%Y-%m"

        period_expr = func.date_trunc(trunc_unit, Purchasing.date).label("period")

        # Compute category-based sums
        goods_sum = func.sum(
            case(
                (Account.account_type == "goods", PurchasingDetail.quantity * PurchasingDetail.price),
                else_=0
            )
        ).label("goods_value")

        service_sum = func.sum(
            case(
                (Account.account_type == "service", PurchasingDetail.quantity * PurchasingDetail.price),
                else_=0
            )
        ).label("service_value")

        total_sum = func.sum(PurchasingDetail.quantity * PurchasingDetail.price).label("total_value")

        # Base query
        q = (
            db.query(period_expr, goods_sum, service_sum, total_sum)
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .group_by(period_expr)
            .order_by(period_expr)
        )

        # Filters
        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)
        if account_type:
            q = q.filter(Account.account_type == account_type.value)

        rows = q.all()

        # Transform results
        data = []
        for r in rows:
            period_dt = r.period
            period_label = period_dt.strftime(fmt)

            week_start = week_end = None
            if granularity == "weekly":
                week_start = period_dt.date()
                week_end = week_start + timedelta(days=6)

            data.append({
                "period": period_label,
                "week_start": week_start.isoformat() if week_start else None,
                "week_end": week_end.isoformat() if week_end else None,
                "goods": float(r.goods_value or 0),
                "service": float(r.service_value or 0),
                "total": float(r.total_value or 0),
            })

        return data
