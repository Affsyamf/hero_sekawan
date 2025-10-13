# backend/app/services/overview_service.py
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends
from sqlalchemy import func, case, and_, extract, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    Ledger, Product, LedgerRef, LedgerLocation,
    ColorKitchenEntry, ColorKitchenEntryDetail, 
    ColorKitchenBatch, ColorKitchenBatchDetail,
    StockOpnameDetail, StockOpname, Design
)
from app.utils.response import APIResponse


class DashboardService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def get_dashboard_data(self, period: str = "1 Bulan"):
        """
        Mengambil semua data untuk dashboard
        period: "1 Bulan", "3 Bulan", "6 Bulan"
        """
        # Parse period
        months = self._parse_period(period)
        start_date = datetime.now() - timedelta(days=30 * months)
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get all metrics
        metrics = self._get_metrics(current_month_start)
        
        # Get stock flow (chart data)
        stock_flow = self._get_stock_flow(start_date, months)
        
        # Get stock by location (donut chart)
        stock_location = self._get_stock_by_location()
        
        # Get top products by usage
        top_products = self._get_top_products(start_date)
        
        # Get design production cost
        design_cost = self._get_design_cost(start_date)
        
        data = {
            "metrics": metrics,
            "stock_flow": stock_flow,
            "stock_location": stock_location,
            "top_products": top_products,
            "design_cost": design_cost
        }
        
        return APIResponse.ok(data=data)

    def _parse_period(self, period: str) -> int:
        """Convert period string to months"""
        period_map = {
            "1 Bulan": 1,
            "3 Bulan": 3,
            "6 Bulan": 6
        }
        return period_map.get(period, 1)

    def _get_metrics(self, current_month_start: datetime) -> dict:
        """Calculate dashboard metrics for current month"""
        # Previous month for trend calculation
        prev_month_start = current_month_start - timedelta(days=30)
        
        # 1. Total Stock Masuk (Purchasing)
        stock_masuk_current = self.db.query(
            func.coalesce(func.sum(Ledger.quantity_in), 0)
        ).filter(
            Ledger.ref == LedgerRef.Purchasing,
            Ledger.date >= current_month_start
        ).scalar()
        
        stock_masuk_prev = self.db.query(
            func.coalesce(func.sum(Ledger.quantity_in), 0)
        ).filter(
            Ledger.ref == LedgerRef.Purchasing,
            Ledger.date >= prev_month_start,
            Ledger.date < current_month_start
        ).scalar()
        
        stock_masuk_trend = self._calculate_trend(stock_masuk_current, stock_masuk_prev)
        
        # 2. Total Stock Keluar (StockMovement + CK)
        stock_keluar_current = self.db.query(
            func.coalesce(func.sum(Ledger.quantity_out), 0)
        ).filter(
            Ledger.ref.in_([LedgerRef.StockMovement, LedgerRef.Ck]),
            Ledger.date >= current_month_start
        ).scalar()
        
        stock_keluar_prev = self.db.query(
            func.coalesce(func.sum(Ledger.quantity_out), 0)
        ).filter(
            Ledger.ref.in_([LedgerRef.StockMovement, LedgerRef.Ck]),
            Ledger.date >= prev_month_start,
            Ledger.date < current_month_start
        ).scalar()
        
        stock_keluar_trend = self._calculate_trend(stock_keluar_current, stock_keluar_prev)
        
        # 3. Total Cost Produksi (CK Entry + Batch)
        ck_entry_cost = self.db.query(
            func.coalesce(func.sum(ColorKitchenEntryDetail.total_cost), 0)
        ).join(ColorKitchenEntry).filter(
            ColorKitchenEntry.date >= current_month_start
        ).scalar()
        
        ck_batch_cost = self.db.query(
            func.coalesce(func.sum(ColorKitchenBatchDetail.total_cost), 0)
        ).join(ColorKitchenBatch).filter(
            ColorKitchenBatch.date >= current_month_start
        ).scalar()
        
        cost_produksi_current = float(ck_entry_cost or 0) + float(ck_batch_cost or 0)
        
        # Previous month cost
        ck_entry_cost_prev = self.db.query(
            func.coalesce(func.sum(ColorKitchenEntryDetail.total_cost), 0)
        ).join(ColorKitchenEntry).filter(
            ColorKitchenEntry.date >= prev_month_start,
            ColorKitchenEntry.date < current_month_start
        ).scalar()
        
        ck_batch_cost_prev = self.db.query(
            func.coalesce(func.sum(ColorKitchenBatchDetail.total_cost), 0)
        ).join(ColorKitchenBatch).filter(
            ColorKitchenBatch.date >= prev_month_start,
            ColorKitchenBatch.date < current_month_start
        ).scalar()
        
        cost_produksi_prev = float(ck_entry_cost_prev or 0) + float(ck_batch_cost_prev or 0)
        cost_produksi_trend = self._calculate_trend(cost_produksi_current, cost_produksi_prev)
        
        # 4. Selisih Stock Opname
        selisih_opname_current = self.db.query(
            func.coalesce(func.sum(func.abs(StockOpnameDetail.difference)), 0)
        ).join(StockOpname).filter(  # join langsung ke StockOpname
            func.extract('month', StockOpname.date) == datetime.now().month,
            func.extract('year', StockOpname.date) == datetime.now().year
        ).scalar()
        
        selisih_opname_prev = self.db.query(
            func.coalesce(func.sum(func.abs(StockOpnameDetail.difference)), 0)
        ).join(StockOpname).filter(
            func.extract('month', StockOpname.date) == (datetime.now().month - 1 or 12),
            func.extract('year', StockOpname.date) == datetime.now().year
        ).scalar()
        
        selisih_opname_trend = self._calculate_trend(selisih_opname_current, selisih_opname_prev)
        
        return {
            "stock_masuk": {
                "value": float(stock_masuk_current or 0),
                "trend": stock_masuk_trend
            },
            "stock_keluar": {
                "value": float(stock_keluar_current or 0),
                "trend": stock_keluar_trend
            },
            "cost_produksi": {
                "value": cost_produksi_current,
                "trend": cost_produksi_trend
            },
            "selisih_opname": {
                "value": float(selisih_opname_current or 0),
                "trend": selisih_opname_trend
            }
        }

    def _calculate_trend(self, current: float, previous: float) -> float:
        """Calculate percentage trend"""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)

    def _get_stock_flow(self, start_date: datetime, months: int) -> list:
        """Get stock in vs out flow per period"""
        # Group by month
        flow_data = []
        
        for i in range(months):
            month_start = start_date + timedelta(days=30 * i)
            month_end = month_start + timedelta(days=30)
            
            # Stock Masuk (Purchasing)
            stock_in = self.db.query(
                func.coalesce(func.sum(Ledger.quantity_in), 0)
            ).filter(
                Ledger.ref == LedgerRef.Purchasing,
                Ledger.date >= month_start,
                Ledger.date < month_end
            ).scalar()
            
            # Stock Keluar (StockMovement + CK)
            stock_out = self.db.query(
                func.coalesce(func.sum(Ledger.quantity_out), 0)
            ).filter(
                Ledger.ref.in_([LedgerRef.StockMovement, LedgerRef.Ck]),
                Ledger.date >= month_start,
                Ledger.date < month_end
            ).scalar()
            
            month_name = month_start.strftime("%b %Y")
            flow_data.append({
                "month": month_name,
                "stockMasuk": float(stock_in or 0),
                "stockKeluar": float(stock_out or 0)
            })
        
        return flow_data

    def _get_stock_by_location(self) -> list:
        """Get current stock distribution by location (percentage)"""
        # Calculate stock per location
        locations = [LedgerLocation.Gudang, LedgerLocation.Kitchen, LedgerLocation.Usage]
        stock_data = []
        total_stock = 0
        
        for location in locations:
            # Stock IN
            stock_in = self.db.query(
                func.coalesce(func.sum(Ledger.quantity_in), 0)
            ).filter(Ledger.location == location).scalar()
            
            # Stock OUT
            stock_out = self.db.query(
                func.coalesce(func.sum(Ledger.quantity_out), 0)
            ).filter(Ledger.location == location).scalar()
            
            current_stock = float(stock_in or 0) - float(stock_out or 0)
            total_stock += current_stock
            
            stock_data.append({
                "location": location.value,
                "stock": current_stock
            })
        
        # Calculate percentage
        result = []
        location_labels = {
            "gudang": "Gudang",
            "kitchen": "Kitchen",
            "usage": "Usage"
        }
        
        for item in stock_data:
            percentage = (item["stock"] / total_stock * 100) if total_stock > 0 else 0
            result.append({
                "label": location_labels.get(item["location"], item["location"]),
                "value": round(percentage, 1)
            })
        
        return result

    def _get_top_products(self, start_date: datetime, limit: int = 5) -> list:
        """Get top products by usage quantity"""
        products = self.db.query(
            Product.name,
            func.sum(Ledger.quantity_out).label("total_usage")
        ).join(
            Ledger, Ledger.product_id == Product.id
        ).filter(
            Ledger.ref.in_([LedgerRef.StockMovement, LedgerRef.Ck]),
            Ledger.date >= start_date
        ).group_by(
            Product.id, Product.name
        ).order_by(
            desc("total_usage")
        ).limit(limit).all()
        
        # Find max value for percentage calculation
        max_value = float(products[0].total_usage) if products else 1
        
        result = []
        for product in products:
            result.append({
                "label": product.name,
                "value": float(product.total_usage),
                "maxValue": max_value
            })
        
        return result

    def _get_design_cost(self, start_date: datetime, limit: int = 5) -> list:
        """Get production cost per design"""
        designs = self.db.query(
            Design.code,
            func.count(ColorKitchenEntry.id).label("orders"),
            func.coalesce(func.sum(ColorKitchenEntryDetail.total_cost), 0).label("entry_cost")
        ).join(
            ColorKitchenEntry, ColorKitchenEntry.design_id == Design.id
        ).outerjoin(
            ColorKitchenEntryDetail, ColorKitchenEntryDetail.color_kitchen_entry_id == ColorKitchenEntry.id
        ).filter(
            ColorKitchenEntry.date >= start_date
        ).group_by(
            Design.id, Design.code
        ).order_by(
            desc("orders")
        ).limit(limit).all()
        
        result = []
        for design in designs:
            # Get batch cost for this design's entries
            batch_cost = self.db.query(
                func.coalesce(func.sum(ColorKitchenBatchDetail.total_cost), 0)
            ).join(
                ColorKitchenBatch, ColorKitchenBatch.id == ColorKitchenBatchDetail.batch_id
            ).join(
                ColorKitchenEntry, ColorKitchenEntry.batch_id == ColorKitchenBatch.id
            ).filter(
                ColorKitchenEntry.design_id == design.id,
                ColorKitchenEntry.date >= start_date
            ).scalar()
            
            total_cost = float(design.entry_cost or 0) + float(batch_cost or 0)
            
            result.append({
                "design": design.code,
                "orders": design.orders,
                "cost": total_cost
            })
        
        return result

    def get_transactions(self, page: int = 1, page_size: int = 10, 
                        product_id: Optional[int] = None,
                        ref_type: Optional[str] = None,
                        start_date: Optional[datetime] = None,
                        end_date: Optional[datetime] = None):
        """Get transaction history from Ledger with pagination"""
        query = self.db.query(Ledger).join(Product)
        
        # Apply filters
        if product_id:
            query = query.filter(Ledger.product_id == product_id)
        
        if ref_type:
            query = query.filter(Ledger.ref == ref_type)
        
        if start_date:
            query = query.filter(Ledger.date >= start_date)
        
        if end_date:
            query = query.filter(Ledger.date <= end_date)
        
        # Count total
        total = query.count()
        
        # Pagination
        transactions = query.order_by(desc(Ledger.date)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        # Format data
        data = []
        type_mapping = {
            LedgerRef.Purchasing: "Purchasing",
            LedgerRef.StockMovement: "Stock Movement",
            LedgerRef.Ck: "Color Kitchen",
            LedgerRef.StockOpname: "Stock Opname"
        }
        
        for txn in transactions:
            # Calculate net quantity
            qty = float(txn.quantity_in or 0) - float(txn.quantity_out or 0)
            
            data.append({
                "date": txn.date.strftime("%Y-%m-%d %H:%M"),
                "type": type_mapping.get(txn.ref, txn.ref.value),
                "ref": txn.ref_code,
                "product": txn.product.name,
                "qty": qty,
                "location": txn.location.value.capitalize()
            })
        
        return {
            "data": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }