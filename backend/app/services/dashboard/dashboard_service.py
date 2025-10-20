# app/services/reporting/dashboard/dashboard_service.py
from sqlalchemy import func
from datetime import datetime
from app.models import (
    Purchasing, PurchasingDetail, 
    StockMovement, StockMovementDetail,
    ColorKitchenEntry, ColorKitchenEntryDetail,
    ColorKitchenBatch, ColorKitchenBatchDetail,
)
from app.services.reporting.base_reporting_service import BaseReportService
from app.utils.response import APIResponse

class DashboardService(BaseReportService):
    """
    Unified dashboard summary for Production Overview
    (Purchasing, Stock, Color Kitchen)
    """
    
    def normalize_filters(self, filters):
        if not filters:
            return {}

        start = getattr(filters, "start_date", None)
        end = getattr(filters, "end_date", None)
        granularity = getattr(filters, "granularity", None)
        account_type = getattr(filters, "account_type", None)

        # ✅ make sure safe default
        return {
            "start_date": start.isoformat() if isinstance(start, datetime) else start,
            "end_date": end.isoformat() if isinstance(end, datetime) else end,
            "granularity": granularity or "monthly",
            "account_type": account_type,
        }

    def run(self, filters):
        filters = self.normalize_filters(filters)
        data = self._get_metrics(filters)
        return APIResponse.ok(meta=filters, data=data)

    # -------------------------------------------------
    # Master Summary Logic
    # -------------------------------------------------
    def _get_metrics(self, filters):
        db = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        total_purchasing = self._calc_total_purchasing(db, start_date, end_date)
        total_stock_terpakai = self._calc_total_stock_terpakai(db, start_date, end_date)
        total_cost_produksi = self._calc_total_cost_produksi(db, start_date, end_date)

        total_jobs = self._count_total_jobs(db, start_date, end_date)
        avg_cost_per_job = total_cost_produksi / total_jobs if total_jobs else 0

        # 🔥 new trend data
        stock_flow = self._get_stock_flow_trend(db, start_date, end_date)
        cost_trend = self._get_cost_trend_ck(db, start_date, end_date)

        return {
            "metrics": {
                "total_purchasing": {"value": total_purchasing, "trend": 0},
                "total_stock_terpakai": {"value": total_stock_terpakai, "trend": 0},
                "total_cost_produksi": {"value": total_cost_produksi, "trend": 0},
                "avg_cost_per_job": {"value": avg_cost_per_job, "trend": 0},
            },
            "stock_flow": stock_flow,
            "cost_trend": cost_trend,
            "most_used_dye": [],
            "most_used_aux": [],
        }
         
    def _get_stock_flow_trend(self, db, start_date, end_date):
        """
        Hitung per bulan:
        - stockMasuk = total purchasing value (barang masuk)
        - stockTerpakai = total stock movement value (barang keluar produksi)
        """
        # --- base purchasing per month ---
        purch_q = (
            db.query(
                func.date_trunc('month', Purchasing.date).label("period"),
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price).label("stockMasuk"),
            )
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .filter(Purchasing.date.isnot(None))   # ✅ ignore NULL date
        )
        if start_date:
            purch_q = purch_q.filter(Purchasing.date >= start_date)
        if end_date:
            purch_q = purch_q.filter(Purchasing.date <= end_date)
        purch_q = purch_q.group_by(func.date_trunc('month', Purchasing.date))

        # --- base stock movement per month ---
        move_q = (
            db.query(
                func.date_trunc('month', StockMovement.date).label("period"),
                func.sum(StockMovementDetail.quantity * StockMovementDetail.unit_cost_used).label("stockTerpakai"),
            )
            .join(StockMovement, StockMovement.id == StockMovementDetail.stock_movement_id)
            .filter(StockMovement.date.isnot(None))   # ✅ ignore NULL date
        )
        if start_date:
            move_q = move_q.filter(StockMovement.date >= start_date)
        if end_date:
            move_q = move_q.filter(StockMovement.date <= end_date)
        move_q = move_q.group_by(func.date_trunc('month', StockMovement.date))

        purch_rows = purch_q.all()
        move_rows = move_q.all()

        # --- normalize by period (merge both) ---
        period_map = {}

        for p in purch_rows:
            if not p.period:
                continue  # ✅ skip jika NULL
            period = p.period.strftime("%Y-%m")
            period_map.setdefault(period, {"month": period, "stockMasuk": 0, "stockTerpakai": 0})
            period_map[period]["stockMasuk"] = float(p.stockMasuk or 0)

        for m in move_rows:
            if not m.period:
                continue  # ✅ skip jika NULL
            period = m.period.strftime("%Y-%m")
            period_map.setdefault(period, {"month": period, "stockMasuk": 0, "stockTerpakai": 0})
            period_map[period]["stockTerpakai"] = float(m.stockTerpakai or 0)

        result = list(period_map.values())
        result.sort(key=lambda r: r["month"])
        return result

    def _get_cost_trend_ck(self, db, start_date, end_date):
        """
        Hitung total cost produksi per bulan:
        - Dyes  = dari ColorKitchenBatchDetail.unit_cost_used
        - Aux   = dari ColorKitchenEntryDetail.unit_cost_used
        """
        # --- DYE (batch) ---
        q_dye = (
            db.query(
                func.date_trunc('month', ColorKitchenBatch.date).label("period"),
                func.sum(ColorKitchenBatchDetail.quantity * ColorKitchenBatchDetail.unit_cost_used).label("total_dye")
            )
            .join(ColorKitchenBatch, ColorKitchenBatch.id == ColorKitchenBatchDetail.batch_id)
            .filter(ColorKitchenBatch.date.isnot(None))
        )
        if start_date:
            q_dye = q_dye.filter(ColorKitchenBatch.date >= start_date)
        if end_date:
            q_dye = q_dye.filter(ColorKitchenBatch.date <= end_date)
        q_dye = q_dye.group_by(func.date_trunc('month', ColorKitchenBatch.date))

        # --- AUX (entry) ---
        q_aux = (
            db.query(
                func.date_trunc('month', ColorKitchenEntry.date).label("period"),
                func.sum(ColorKitchenEntryDetail.quantity * ColorKitchenEntryDetail.unit_cost_used).label("total_aux")
            )
            .join(ColorKitchenEntry, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)
            .filter(ColorKitchenEntry.date.isnot(None))
        )
        if start_date:
            q_aux = q_aux.filter(ColorKitchenEntry.date >= start_date)
        if end_date:
            q_aux = q_aux.filter(ColorKitchenEntry.date <= end_date)
        q_aux = q_aux.group_by(func.date_trunc('month', ColorKitchenEntry.date))

        dye_rows = q_dye.all()
        aux_rows = q_aux.all()

        # --- Merge both per month ---
        period_map = {}

        for r in dye_rows:
            if not r.period:
                continue
            period = r.period.strftime("%Y-%m")
            period_map.setdefault(period, {"month": period, "total_dye": 0, "total_aux": 0, "total_cost": 0})
            period_map[period]["total_dye"] = float(r.total_dye or 0)

        for r in aux_rows:
            if not r.period:
                continue
            period = r.period.strftime("%Y-%m")
            period_map.setdefault(period, {"month": period, "total_dye": 0, "total_aux": 0, "total_cost": 0})
            period_map[period]["total_aux"] = float(r.total_aux or 0)

        for period, vals in period_map.items():
            vals["total_cost"] = vals["total_dye"] + vals["total_aux"]

        result = list(period_map.values())
        result.sort(key=lambda x: x["month"])
        return result

    # -------------------------------------------------
    # Real Queries per Domain
    # -------------------------------------------------
    def _calc_total_purchasing(self, db, start_date, end_date):
        q = (
            db.query(func.sum(PurchasingDetail.quantity * PurchasingDetail.price))
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
        )
        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)
        return float(q.scalar() or 0)

    def _calc_total_stock_terpakai(self, db, start_date, end_date):
        q = (
            db.query(func.sum(StockMovementDetail.quantity * StockMovementDetail.unit_cost_used))
            .join(StockMovement, StockMovement.id == StockMovementDetail.stock_movement_id)
        )
        if start_date:
            q = q.filter(StockMovement.date >= start_date)
        if end_date:
            q = q.filter(StockMovement.date <= end_date)
        return float(q.scalar() or 0)

    def _calc_total_cost_produksi(self, db, start_date, end_date):
        # Combine Dyes (batch) + Aux (entry)
        q_dye = (
            db.query(func.sum(ColorKitchenBatchDetail.quantity * ColorKitchenBatchDetail.unit_cost_used))
            .join(ColorKitchenBatch, ColorKitchenBatch.id == ColorKitchenBatchDetail.batch_id)
        )
        q_aux = (
            db.query(func.sum(ColorKitchenEntryDetail.quantity * ColorKitchenEntryDetail.unit_cost_used))
            .join(ColorKitchenEntry, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)
        )
        if start_date:
            q_dye = q_dye.filter(ColorKitchenBatch.date >= start_date)
            q_aux = q_aux.filter(ColorKitchenEntry.date >= start_date)
        if end_date:
            q_dye = q_dye.filter(ColorKitchenBatch.date <= end_date)
            q_aux = q_aux.filter(ColorKitchenEntry.date <= end_date)

        total_dye = float(q_dye.scalar() or 0)
        total_aux = float(q_aux.scalar() or 0)
        return total_dye + total_aux

    def _count_total_jobs(self, db, start_date, end_date):
        q = db.query(func.count(ColorKitchenEntry.id))
        if start_date:
            q = q.filter(ColorKitchenEntry.date >= start_date)
        if end_date:
            q = q.filter(ColorKitchenEntry.date <= end_date)
        return int(q.scalar() or 0)
