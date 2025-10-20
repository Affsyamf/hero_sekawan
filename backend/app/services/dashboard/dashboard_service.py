from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends
from sqlalchemy import func, desc
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import (
    Ledger, Product, LedgerRef,
    ColorKitchenEntry, ColorKitchenEntryDetail,
    ColorKitchenBatch, ColorKitchenBatchDetail,
    ProductAvgCostCache,
)
from app.utils.response import APIResponse


class DashboardService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    # ==============================================================
    # MAIN ENTRY
    # ==============================================================
    def run(self, filters):
        """
        Terima ListRequest dari router (bukan dict langsung).
        Extract filter dict dengan aman agar tetap kompatibel dengan style risna.
        """
        # kalau pakai ListRequest, ambil dari filters.filters
        if hasattr(filters, "filters"):
            filters = filters.filters or {}
        # kalau bukan, fallback ke dict kosong
        elif not isinstance(filters, dict):
            filters = {}

        filters = self._normalize_filters(filters)

        start_date = self._parse_date(filters["start_date"])
        end_date = self._parse_date(filters["end_date"])
        granularity = filters["granularity"]

        data = {
            "metrics": self._get_metrics(start_date, end_date),
            "stock_flow": self._get_stock_flow(start_date, end_date, granularity),
            "cost_trend": self._get_cost_trend(start_date, end_date, granularity),
            "most_used_dye": self._get_most_used_products(start_date, end_date, "DYE", 5),
            "most_used_aux": self._get_most_used_products(start_date, end_date, "AUX", 5),
        }

        return APIResponse.ok(meta=filters, data=data)


    # ==============================================================
    # FILTER PARSING & NORMALIZATION
    # ==============================================================
    def _normalize_filters(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize start_date, end_date, and granularity from frontend"""
        now = datetime.now()

        # 1️⃣ Date range
        start_str = filters.get("start_date")
        end_str = filters.get("end_date")

        if start_str:
            start_date = self._parse_date(start_str)
        else:
            start_date = now - timedelta(days=30)

        if end_str:
            end_date = self._parse_date(end_str)
        else:
            end_date = now

        # 2️⃣ Granularity (daily / weekly / monthly / yearly)
        granularity = (filters.get("granularity") or "monthly").lower()
        if granularity not in ["daily", "weekly", "monthly", "yearly"]:
            granularity = "monthly"

        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "granularity": granularity,
        }

    def _parse_date(self, value: str) -> datetime:
        """Safe parse ISO or YYYY-MM-DD"""
        if isinstance(value, datetime):
            return value
        value = value.strip().replace("Z", "")
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return datetime.strptime(value.split("T")[0], "%Y-%m-%d")

    # ==============================================================
    # METRICS
    # ==============================================================
    def _get_metrics(self, start_date: datetime, end_date: datetime) -> dict:
        """Calculate top KPI metrics"""
        current = {
            "total_purchasing": self._calc_total_purchasing(start_date, end_date),
            "total_stock_terpakai": self._calc_total_stock_terpakai(start_date, end_date),
            "total_cost_produksi": self._calc_total_cost_produksi(start_date, end_date),
            "total_jobs": self._calc_total_jobs(start_date, end_date),
        }

        avg_cost = (
            current["total_cost_produksi"] / current["total_jobs"]
            if current["total_jobs"] > 0 else 0
        )

        return {
            "total_purchasing": {"value": current["total_purchasing"], "trend": 0},
            "total_stock_terpakai": {"value": current["total_stock_terpakai"], "trend": 0},
            "total_cost_produksi": {"value": current["total_cost_produksi"], "trend": 0},
            "avg_cost_per_job": {"value": avg_cost, "trend": 0},
        }

    def _calc_total_purchasing(self, start_date: datetime, end_date: datetime) -> float:
        q = (
            self.db.query(func.coalesce(func.sum(Ledger.quantity_in * ProductAvgCostCache.avg_cost), 0))
            .join(ProductAvgCostCache, ProductAvgCostCache.product_id == Ledger.product_id)
            .filter(Ledger.ref == LedgerRef.Purchasing, Ledger.date >= start_date, Ledger.date <= end_date)
        )
        return float(q.scalar() or 0)

    def _calc_total_stock_terpakai(self, start_date: datetime, end_date: datetime) -> float:
        q = (
            self.db.query(func.coalesce(func.sum(Ledger.quantity_out * ProductAvgCostCache.avg_cost), 0))
            .join(ProductAvgCostCache, ProductAvgCostCache.product_id == Ledger.product_id)
            .filter(Ledger.ref.in_([LedgerRef.StockMovement, LedgerRef.Ck]),
                    Ledger.date >= start_date, Ledger.date <= end_date)
        )
        return float(q.scalar() or 0)

    def _calc_total_cost_produksi(self, start_date: datetime, end_date: datetime) -> float:
        ck_entry = (
            self.db.query(func.coalesce(func.sum(ColorKitchenEntryDetail.total_cost), 0))
            .join(ColorKitchenEntry)
            .filter(ColorKitchenEntry.date >= start_date, ColorKitchenEntry.date <= end_date)
            .scalar()
        )
        ck_batch = (
            self.db.query(func.coalesce(func.sum(ColorKitchenBatchDetail.total_cost), 0))
            .join(ColorKitchenBatch)
            .filter(ColorKitchenBatch.date >= start_date, ColorKitchenBatch.date <= end_date)
            .scalar()
        )
        return float(ck_entry or 0) + float(ck_batch or 0)

    def _calc_total_jobs(self, start_date: datetime, end_date: datetime) -> int:
        q = self.db.query(func.count(ColorKitchenEntry.id)).filter(
            ColorKitchenEntry.date >= start_date, ColorKitchenEntry.date <= end_date
        )
        return int(q.scalar() or 0)

    # ==============================================================
    # CHARTS — STOCK FLOW & COST TREND
    # ==============================================================
    def _get_stock_flow(self, start_date: datetime, end_date: datetime, granularity: str):
        """Stock flow grouped by granularity"""
        group_func = self._get_group_trunc(granularity)

        results = (
            self.db.query(
                group_func(Ledger.date).label("period"),
                func.sum(Ledger.quantity_in).label("stock_in"),
                func.sum(Ledger.quantity_out).label("stock_out"),
            )
            .filter(Ledger.date >= start_date, Ledger.date <= end_date)
            .group_by("period")
            .order_by("period")
            .all()
        )

        return [
            {
                "period": self._format_period_label(r.period, granularity),
                "stockMasuk": float(r.stock_in or 0),
                "stockTerpakai": float(r.stock_out or 0),
            }
            for r in results
        ]

    def _get_cost_trend(self, start_date: datetime, end_date: datetime, granularity: str):
        """Production cost trend grouped by granularity"""
        group_func = self._get_group_trunc(granularity)

        ck_entry = (
            self.db.query(group_func(ColorKitchenEntry.date).label("period"),
                          func.sum(ColorKitchenEntryDetail.total_cost).label("cost"))
            .join(ColorKitchenEntry)
            .filter(ColorKitchenEntry.date >= start_date, ColorKitchenEntry.date <= end_date)
            .group_by("period")
        )

        ck_batch = (
            self.db.query(group_func(ColorKitchenBatch.date).label("period"),
                          func.sum(ColorKitchenBatchDetail.total_cost).label("cost"))
            .join(ColorKitchenBatch)
            .filter(ColorKitchenBatch.date >= start_date, ColorKitchenBatch.date <= end_date)
            .group_by("period")
        )

        combined: Dict[datetime, float] = {}
        for r in ck_entry.all() + ck_batch.all():
            combined[r.period] = combined.get(r.period, 0) + float(r.cost or 0)

        return [
            {"period": self._format_period_label(p, granularity), "value": v}
            for p, v in sorted(combined.items())
        ]

    # ==============================================================
    # UTIL: grouping + label
    # ==============================================================
    def _get_group_trunc(self, granularity: str):
        """Return SQLAlchemy truncation function"""
        if granularity == "daily":
            return lambda c: func.date_trunc("day", c)
        elif granularity == "weekly":
            return lambda c: func.date_trunc("week", c)
        elif granularity == "yearly":
            return lambda c: func.date_trunc("year", c)
        else:
            return lambda c: func.date_trunc("month", c)

    def _format_period_label(self, dt: datetime, granularity: str) -> str:
        if not dt:
            return "-"
        if granularity == "daily":
            return dt.strftime("%d %b %Y")
        elif granularity == "weekly":
            return f"Week {dt.strftime('%U')} {dt.year}"
        elif granularity == "yearly":
            return dt.strftime("%Y")
        return dt.strftime("%b %Y")

    # ==============================================================
    # MOST USED PRODUCTS
    # ==============================================================
    def _get_most_used_products(self, start_date: datetime, end_date: datetime,
                                product_type: str = None, limit: int = 5):
        if product_type == "DYE":
            q = (
                self.db.query(Product.name, func.sum(ColorKitchenBatchDetail.quantity).label("usage"))
                .join(ColorKitchenBatchDetail, ColorKitchenBatchDetail.product_id == Product.id)
                .join(ColorKitchenBatch, ColorKitchenBatch.id == ColorKitchenBatchDetail.batch_id)
                .filter(ColorKitchenBatch.date >= start_date, ColorKitchenBatch.date <= end_date)
                .group_by(Product.id, Product.name)
                .order_by(desc("usage"))
                .limit(limit)
            )
        else:
            q = (
                self.db.query(Product.name, func.sum(ColorKitchenEntryDetail.quantity).label("usage"))
                .join(ColorKitchenEntryDetail, ColorKitchenEntryDetail.product_id == Product.id)
                .join(ColorKitchenEntry, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)
                .filter(ColorKitchenEntry.date >= start_date, ColorKitchenEntry.date <= end_date)
                .group_by(Product.id, Product.name)
                .order_by(desc("usage"))
                .limit(limit)
            )

        rows = q.all()
        max_val = float(rows[0].usage or 0) if rows else 1
        return [
            {"label": r.name, "value": float(r.usage or 0), "maxValue": round(max_val * 1.2, 2)}
            for r in rows
        ]
