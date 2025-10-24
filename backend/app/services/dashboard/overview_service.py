# app/services/dashboard/dashboard_service.py
from datetime import datetime, timedelta
from typing import Optional
from dateutil.relativedelta import relativedelta
import traceback

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models import (
    Ledger, Product, LedgerRef, LedgerLocation,
    ColorKitchenEntry, ColorKitchenEntryDetail, 
    ColorKitchenBatch, ColorKitchenBatchDetail,
    StockOpnameDetail, StockOpname, Design, 
    Purchasing, PurchasingDetail
)
from app.utils.response import APIResponse


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_data(
        self, 
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        granularity: str = "monthly"
    ):
        """
        Mengambil semua data untuk dashboard dengan date range filter
        """
        try:
            # Parse dates
            if start_date and end_date:
                try:
                    date_from = datetime.strptime(start_date, "%Y-%m-%d")
                    date_to = datetime.strptime(end_date, "%Y-%m-%d")
                except ValueError as e:
                    print(f"❌ Date parsing error: {e}")
                    return APIResponse.bad_request(message=f"Invalid date format: {str(e)}")
            else:
                # Default: last 30 days
                date_to = datetime.now()
                date_from = date_to - timedelta(days=30)
            
            # Calculate previous period for trend
            period_days = (date_to - date_from).days
            prev_date_to = date_from
            prev_date_from = date_from - timedelta(days=period_days)
            
            print(f"📅 Dashboard Date Range: {date_from.date()} to {date_to.date()}")
            print(f"📅 Previous Period: {prev_date_from.date()} to {prev_date_to.date()}")
            print(f"📊 Granularity: {granularity}")
            
            # Get metrics with error handling
            try:
                print("🔄 Fetching metrics...")
                metrics = self._get_metrics(date_from, date_to, prev_date_from, prev_date_to)
                print(f"✅ Metrics fetched: {metrics}")
            except Exception as e:
                print(f"❌ Error fetching metrics: {str(e)}")
                traceback.print_exc()
                return APIResponse.internal_error(message=f"Error fetching metrics: {str(e)}")
            
            # Get cost trend
            try:
                print("🔄 Fetching cost trend...")
                cost_trend = self._get_cost_trend(date_from, date_to, granularity)
                print(f"✅ Cost trend fetched: {len(cost_trend)} periods")
            except Exception as e:
                print(f"❌ Error fetching cost trend: {str(e)}")
                traceback.print_exc()
                cost_trend = []
            
            # Get stock flow
            try:
                print("🔄 Fetching stock flow...")
                stock_flow = self._get_stock_flow(date_from, date_to, granularity)
                print(f"✅ Stock flow fetched: {len(stock_flow)} periods")
            except Exception as e:
                print(f"❌ Error fetching stock flow: {str(e)}")
                traceback.print_exc()
                stock_flow = []
            
            # Get most used products
            try:
                print("🔄 Fetching most used dye...")
                most_used_dye = self._get_most_used_products(date_from, date_to, "Dye", limit=5)
                print(f"✅ Most used dye fetched: {len(most_used_dye)} items")
            except Exception as e:
                print(f"❌ Error fetching most used dye: {str(e)}")
                traceback.print_exc()
                most_used_dye = []
            
            try:
                print("🔄 Fetching most used aux...")
                most_used_aux = self._get_most_used_products(date_from, date_to, "Aux", limit=5)
                print(f"✅ Most used aux fetched: {len(most_used_aux)} items")
            except Exception as e:
                print(f"❌ Error fetching most used aux: {str(e)}")
                traceback.print_exc()
                most_used_aux = []
            
            data = {
                "metrics": metrics,
                "cost_trend": cost_trend,
                "stock_flow": stock_flow,
                "most_used_dye": most_used_dye,
                "most_used_aux": most_used_aux
            }
            
            print("✅ Dashboard data compiled successfully")
            return APIResponse.ok(data=data)
            
        except Exception as e:
            print(f"❌ Fatal error in get_dashboard_data: {str(e)}")
            traceback.print_exc()
            return APIResponse.internal_error(message=f"Failed to fetch dashboard data: {str(e)}")

    def _get_metrics(
        self, 
        date_from: datetime, 
        date_to: datetime,
        prev_date_from: datetime,
        prev_date_to: datetime
    ) -> dict:
        """Calculate dashboard metrics with trend comparison"""
        
        print("  → Calculating total_purchasing...")
        # 1. Total Purchasing
        try:
            total_purchasing_current = self.db.query(
                func.coalesce(func.sum(PurchasingDetail.total), 0)
            ).join(Purchasing).filter(
                Purchasing.date >= date_from,
                Purchasing.date <= date_to
            ).scalar()
            
            total_purchasing_prev = self.db.query(
                func.coalesce(func.sum(PurchasingDetail.total), 0)
            ).join(Purchasing).filter(
                Purchasing.date >= prev_date_from,
                Purchasing.date < prev_date_to
            ).scalar()
            
            total_purchasing_trend = self._calculate_trend(
                float(total_purchasing_current or 0), 
                float(total_purchasing_prev or 0)
            )
            print(f"    ✓ total_purchasing: {total_purchasing_current}, trend: {total_purchasing_trend}%")
        except Exception as e:
            print(f"    ✗ Error in total_purchasing: {e}")
            total_purchasing_current = 0
            total_purchasing_trend = 0
        
        print("  → Calculating total_stock_terpakai...")
        # 2. Total Stock Terpakai
        try:
            ck_entry_qty = self.db.query(
                func.coalesce(func.sum(ColorKitchenEntryDetail.quantity), 0)
            ).join(ColorKitchenEntry).filter(
                ColorKitchenEntry.date >= date_from,
                ColorKitchenEntry.date <= date_to
            ).scalar()
            
            ck_batch_qty = self.db.query(
                func.coalesce(func.sum(ColorKitchenBatchDetail.quantity), 0)
            ).join(ColorKitchenBatch).filter(
                ColorKitchenBatch.date >= date_from,
                ColorKitchenBatch.date <= date_to
            ).scalar()
            
            total_stock_terpakai_current = float(ck_entry_qty or 0) + float(ck_batch_qty or 0)
            
            # Previous period
            ck_entry_qty_prev = self.db.query(
                func.coalesce(func.sum(ColorKitchenEntryDetail.quantity), 0)
            ).join(ColorKitchenEntry).filter(
                ColorKitchenEntry.date >= prev_date_from,
                ColorKitchenEntry.date < prev_date_to
            ).scalar()
            
            ck_batch_qty_prev = self.db.query(
                func.coalesce(func.sum(ColorKitchenBatchDetail.quantity), 0)
            ).join(ColorKitchenBatch).filter(
                ColorKitchenBatch.date >= prev_date_from,
                ColorKitchenBatch.date < prev_date_to
            ).scalar()
            
            total_stock_terpakai_prev = float(ck_entry_qty_prev or 0) + float(ck_batch_qty_prev or 0)
            
            total_stock_terpakai_trend = self._calculate_trend(
                total_stock_terpakai_current, 
                total_stock_terpakai_prev
            )
            print(f"    ✓ total_stock_terpakai: {total_stock_terpakai_current}, trend: {total_stock_terpakai_trend}%")
        except Exception as e:
            print(f"    ✗ Error in total_stock_terpakai: {e}")
            total_stock_terpakai_current = 0
            total_stock_terpakai_trend = 0
        
        print("  → Calculating total_cost_produksi...")
        # 3. Total Cost Produksi
        try:
            ck_entry_cost = self.db.query(
                func.coalesce(func.sum(ColorKitchenEntryDetail.total_cost), 0)
            ).join(ColorKitchenEntry).filter(
                ColorKitchenEntry.date >= date_from,
                ColorKitchenEntry.date <= date_to
            ).scalar()
            
            ck_batch_cost = self.db.query(
                func.coalesce(func.sum(ColorKitchenBatchDetail.total_cost), 0)
            ).join(ColorKitchenBatch).filter(
                ColorKitchenBatch.date >= date_from,
                ColorKitchenBatch.date <= date_to
            ).scalar()
            
            total_cost_produksi_current = float(ck_entry_cost or 0) + float(ck_batch_cost or 0)
            
            # Previous period
            ck_entry_cost_prev = self.db.query(
                func.coalesce(func.sum(ColorKitchenEntryDetail.total_cost), 0)
            ).join(ColorKitchenEntry).filter(
                ColorKitchenEntry.date >= prev_date_from,
                ColorKitchenEntry.date < prev_date_to
            ).scalar()
            
            ck_batch_cost_prev = self.db.query(
                func.coalesce(func.sum(ColorKitchenBatchDetail.total_cost), 0)
            ).join(ColorKitchenBatch).filter(
                ColorKitchenBatch.date >= prev_date_from,
                ColorKitchenBatch.date < prev_date_to
            ).scalar()
            
            total_cost_produksi_prev = float(ck_entry_cost_prev or 0) + float(ck_batch_cost_prev or 0)
            
            total_cost_produksi_trend = self._calculate_trend(
                total_cost_produksi_current, 
                total_cost_produksi_prev
            )
            print(f"    ✓ total_cost_produksi: {total_cost_produksi_current}, trend: {total_cost_produksi_trend}%")
        except Exception as e:
            print(f"    ✗ Error in total_cost_produksi: {e}")
            total_cost_produksi_current = 0
            total_cost_produksi_trend = 0
        
        print("  → Calculating avg_cost_per_job...")
        # 4. Average Cost per Job
        try:
            total_jobs = self.db.query(
                func.count(ColorKitchenEntry.id)
            ).filter(
                ColorKitchenEntry.date >= date_from,
                ColorKitchenEntry.date <= date_to
            ).scalar()
            
            avg_cost_per_job_current = (
                total_cost_produksi_current / total_jobs if total_jobs > 0 else 0
            )
            
            total_jobs_prev = self.db.query(
                func.count(ColorKitchenEntry.id)
            ).filter(
                ColorKitchenEntry.date >= prev_date_from,
                ColorKitchenEntry.date < prev_date_to
            ).scalar()
            
            avg_cost_per_job_prev = (
                total_cost_produksi_prev / total_jobs_prev if total_jobs_prev > 0 else 0
            )
            
            avg_cost_per_job_trend = self._calculate_trend(
                avg_cost_per_job_current,
                avg_cost_per_job_prev
            )
            print(f"    ✓ avg_cost_per_job: {avg_cost_per_job_current}, trend: {avg_cost_per_job_trend}%")
        except Exception as e:
            print(f"    ✗ Error in avg_cost_per_job: {e}")
            avg_cost_per_job_current = 0
            avg_cost_per_job_trend = 0
        
        return {
            "total_purchasing": {
                "value": float(total_purchasing_current or 0),
                "trend": total_purchasing_trend
            },
            "total_stock_terpakai": {
                "value": total_stock_terpakai_current,
                "trend": total_stock_terpakai_trend
            },
            "total_cost_produksi": {
                "value": total_cost_produksi_current,
                "trend": total_cost_produksi_trend
            },
            "avg_cost_per_job": {
                "value": avg_cost_per_job_current,
                "trend": avg_cost_per_job_trend
            }
        }

    def _calculate_trend(self, current: float, previous: float) -> float:
        """Calculate percentage trend"""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)

    def _get_cost_trend(
        self, 
        date_from: datetime, 
        date_to: datetime, 
        granularity: str
    ) -> list:
        """Get production cost trend based on granularity"""
        periods = self._generate_periods(date_from, date_to, granularity)
        cost_data = []
        
        for period_start, period_end, label in periods:
            try:
                entry_cost = self.db.query(
                    func.coalesce(func.sum(ColorKitchenEntryDetail.total_cost), 0)
                ).join(ColorKitchenEntry).filter(
                    ColorKitchenEntry.date >= period_start,
                    ColorKitchenEntry.date < period_end
                ).scalar()
                
                batch_cost = self.db.query(
                    func.coalesce(func.sum(ColorKitchenBatchDetail.total_cost), 0)
                ).join(ColorKitchenBatch).filter(
                    ColorKitchenBatch.date >= period_start,
                    ColorKitchenBatch.date < period_end
                ).scalar()
                
                total_cost = float(entry_cost or 0) + float(batch_cost or 0)
                
                cost_data.append({
                    "period": label,
                    "total_cost": total_cost
                })
            except Exception as e:
                print(f"    ✗ Error in period {label}: {e}")
                cost_data.append({
                    "period": label,
                    "total_cost": 0
                })
        
        return cost_data

    def _get_stock_flow(
        self, 
        date_from: datetime, 
        date_to: datetime,
        granularity: str
    ) -> list:
        """Get stock in vs out flow per period"""
        periods = self._generate_periods(date_from, date_to, granularity)
        flow_data = []
        
        for period_start, period_end, label in periods:
            try:
                stock_masuk = self.db.query(
                    func.coalesce(func.sum(PurchasingDetail.quantity), 0)
                ).join(Purchasing).filter(
                    Purchasing.date >= period_start,
                    Purchasing.date < period_end
                ).scalar()
                
                ck_entry_qty = self.db.query(
                    func.coalesce(func.sum(ColorKitchenEntryDetail.quantity), 0)
                ).join(ColorKitchenEntry).filter(
                    ColorKitchenEntry.date >= period_start,
                    ColorKitchenEntry.date < period_end
                ).scalar()
                
                ck_batch_qty = self.db.query(
                    func.coalesce(func.sum(ColorKitchenBatchDetail.quantity), 0)
                ).join(ColorKitchenBatch).filter(
                    ColorKitchenBatch.date >= period_start,
                    ColorKitchenBatch.date < period_end
                ).scalar()
                
                stock_terpakai = float(ck_entry_qty or 0) + float(ck_batch_qty or 0)
                
                flow_data.append({
                    "period": label,
                    "stockMasuk": float(stock_masuk or 0),
                    "stockTerpakai": stock_terpakai
                })
            except Exception as e:
                print(f"    ✗ Error in period {label}: {e}")
                flow_data.append({
                    "period": label,
                    "stockMasuk": 0,
                    "stockTerpakai": 0
                })
        
        return flow_data

    def _get_most_used_products(
        self, 
        date_from: datetime, 
        date_to: datetime,
        product_type: str,
        limit: int = 5
    ) -> list:
        """Get most used products by type (Dye or Aux)"""
        try:
            # Query dari CK Entry Detail
            entry_products = self.db.query(
                Product.name,
                func.sum(ColorKitchenEntryDetail.quantity).label("total_qty")
            ).join(
                ColorKitchenEntryDetail, ColorKitchenEntryDetail.product_id == Product.id
            ).join(
                ColorKitchenEntry, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id
            ).filter(
                Product.type == product_type,
                ColorKitchenEntry.date >= date_from,
                ColorKitchenEntry.date <= date_to
            ).group_by(
                Product.id, Product.name
            )
            
            # Query dari CK Batch Detail
            batch_products = self.db.query(
                Product.name,
                func.sum(ColorKitchenBatchDetail.quantity).label("total_qty")
            ).join(
                ColorKitchenBatchDetail, ColorKitchenBatchDetail.product_id == Product.id
            ).join(
                ColorKitchenBatch, ColorKitchenBatch.id == ColorKitchenBatchDetail.batch_id
            ).filter(
                Product.type == product_type,
                ColorKitchenBatch.date >= date_from,
                ColorKitchenBatch.date <= date_to
            ).group_by(
                Product.id, Product.name
            )
            
            # Combine and aggregate
            combined = {}
            for product in entry_products.all():
                combined[product.name] = float(product.total_qty or 0)
            
            for product in batch_products.all():
                if product.name in combined:
                    combined[product.name] += float(product.total_qty or 0)
                else:
                    combined[product.name] = float(product.total_qty or 0)
            
            # Sort and limit
            sorted_products = sorted(
                combined.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:limit]
            
            result = []
            for name, qty in sorted_products:
                result.append({
                    "product": name,
                    "quantity": qty
                })
            
            return result
        except Exception as e:
            print(f"    ✗ Error fetching most used {product_type}: {e}")
            return []

    def _generate_periods(
        self, 
        date_from: datetime, 
        date_to: datetime, 
        granularity: str
    ) -> list:
        """Generate time periods based on granularity"""
        periods = []
        current = date_from
        
        try:
            if granularity == "daily":
                while current <= date_to:
                    next_day = current + timedelta(days=1)
                    label = current.strftime("%d %b")
                    periods.append((current, next_day, label))
                    current = next_day
                    
            elif granularity == "weekly":
                while current <= date_to:
                    next_week = current + timedelta(days=7)
                    label = f"Week {current.strftime('%d %b')}"
                    periods.append((current, next_week, label))
                    current = next_week
                    
            elif granularity == "monthly":
                while current <= date_to:
                    next_month = current + relativedelta(months=1)
                    label = current.strftime("%b %Y")
                    periods.append((current, next_month, label))
                    current = next_month
                    
            elif granularity == "yearly":
                while current <= date_to:
                    next_year = current + relativedelta(years=1)
                    label = current.strftime("%Y")
                    periods.append((current, next_year, label))
                    current = next_year
        except Exception as e:
            print(f"    ✗ Error generating periods: {e}")
            # Return at least one period
            periods = [(date_from, date_to, "Total")]
        
        return periods