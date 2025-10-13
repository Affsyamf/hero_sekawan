# backend/api/dashboard/dashboard_service.py
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, desc, case, extract, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    Product, Purchasing, PurchasingDetail, StockMovement, StockMovementDetail,
    StockOpname, StockOpnameDetail, Ledger, Design, ColorKitchenEntry, ColorKitchenEntryDetail,
    ColorKitchenBatchDetail, LedgerRef
)
from app.utils.response import APIResponse


class DashboardService:
    def __init__(self):
        self.db: Session = next(get_db())

    def _get_month_range(self, month: Optional[int] = None, year: Optional[int] = None) -> Tuple[datetime, datetime]:
        """Get start and end date for a specific month"""
        if not month:
            month = datetime.now().month
        if not year:
            year = datetime.now().year
            
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year, 12, 31, 23, 59, 59)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)
        
        return start_date, end_date

    def _get_previous_month_range(self, month: int, year: int) -> Tuple[datetime, datetime]:
        """Get start and end date for previous month"""
        if month == 1:
            prev_month = 12
            prev_year = year - 1
        else:
            prev_month = month - 1
            prev_year = year
        
        return self._get_month_range(prev_month, prev_year)

    def get_dashboard_data(
        self, 
        period: str = "1 Bulan",
        month: Optional[int] = None,
        year: Optional[int] = None
    ):
        """
        Main dashboard endpoint - Returns ALL data needed for dashboard page
        """
        try:
            # Get current month range
            start_date, end_date = self._get_month_range(month, year)
            prev_start, prev_end = self._get_previous_month_range(
                month or datetime.now().month,
                year or datetime.now().year
            )

            # 1. METRICS - 4 stat cards
            metrics = self._get_metrics(start_date, end_date, prev_start, prev_end)
            
            # 2. STOCK FLOW CHART - Bar chart data (monthly)
            stock_flow = self._get_stock_flow_data(period, year or datetime.now().year)
            
            # 3. STOCK LOCATION - Donut chart (stock per product)
            stock_location = self._get_stock_by_product()
            
            # 4. TOP PRODUCTS - Fast moving products
            top_products = self._get_top_fast_moving_products(start_date, end_date, limit=5)
            
            # 5. DESIGN COST - Cost per design
            design_cost = self._get_design_cost_data(start_date, end_date, limit=5)
            
            # 6. RECENT TRANSACTIONS - Last transactions table
            recent_transactions = self._get_recent_transactions(limit=10)

            response_data = {
                "metrics": metrics,
                "stock_flow": stock_flow,
                "stock_location": stock_location,
                "top_products": top_products,
                "design_cost": design_cost,
                "recent_transactions": recent_transactions,
            }

            return APIResponse.ok(data=response_data)

        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error fetching dashboard data: {str(e)}"
            )

    def _get_metrics(
        self, 
        start_date: datetime, 
        end_date: datetime,
        prev_start: datetime,
        prev_end: datetime
    ) -> Dict:
        """
        Get 4 metric cards data
        """
        # 1. Total Stock Masuk (from Purchasing)
        stock_masuk_current = (
            self.db.query(func.sum(PurchasingDetail.quantity))
            .join(Purchasing)
            .filter(Purchasing.date.between(start_date, end_date))
            .scalar() or 0
        )
        
        stock_masuk_prev = (
            self.db.query(func.sum(PurchasingDetail.quantity))
            .join(Purchasing)
            .filter(Purchasing.date.between(prev_start, prev_end))
            .scalar() or 0
        )
        
        # 2. Total Stock Keluar (from Stock Movement)
        stock_keluar_current = (
            self.db.query(func.sum(StockMovementDetail.quantity))
            .join(StockMovement)
            .filter(StockMovement.date.between(start_date, end_date))
            .scalar() or 0
        )
        
        stock_keluar_prev = (
            self.db.query(func.sum(StockMovementDetail.quantity))
            .join(StockMovement)
            .filter(StockMovement.date.between(prev_start, prev_end))
            .scalar() or 0
        )
        
        # 3. Total Cost Produksi (from Purchasing price)
        cost_produksi_current = (
            self.db.query(
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price)
            )
            .join(Purchasing)
            .filter(Purchasing.date.between(start_date, end_date))
            .scalar() or 0
        )
        
        cost_produksi_prev = (
            self.db.query(
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price)
            )
            .join(Purchasing)
            .filter(Purchasing.date.between(prev_start, prev_end))
            .scalar() or 0
        )
        
        # 4. Selisih Stock Opname
        selisih_opname_current = (
            self.db.query(func.sum(StockOpnameDetail.difference))
            .join(StockOpname)
            .filter(StockOpname.date.between(start_date, end_date))
            .scalar() or 0
        )
        
        selisih_opname_prev = (
            self.db.query(func.sum(StockOpnameDetail.difference))
            .join(StockOpname)
            .filter(StockOpname.date.between(prev_start, prev_end))
            .scalar() or 0
        )

        # Calculate trends
        def calc_trend(current, previous):
            if previous == 0:
                return 0
            return round(((current - previous) / previous) * 100, 1)

        return {
            "stock_masuk": {
                "value": float(stock_masuk_current),
                "trend": calc_trend(float(stock_masuk_current), float(stock_masuk_prev))
            },
            "stock_keluar": {
                "value": float(stock_keluar_current),
                "trend": calc_trend(float(stock_keluar_current), float(stock_keluar_prev))
            },
            "cost_produksi": {
                "value": float(cost_produksi_current),
                "trend": calc_trend(float(cost_produksi_current), float(cost_produksi_prev))
            },
            "selisih_opname": {
                "value": abs(float(selisih_opname_current)),
                "trend": calc_trend(abs(float(selisih_opname_current)), abs(float(selisih_opname_prev)))
            }
        }

    def _get_stock_flow_data(self, period: str, year: int) -> List[Dict]:
        """
        Get stock flow data for bar chart (monthly data)
        """
        # Determine how many months based on period
        if period == "1 Bulan":
            months_count = 1
        elif period == "3 Bulan":
            months_count = 3
        else:  # "6 Bulan"
            months_count = 6

        result = []
        current_date = datetime.now()
        
        for i in range(months_count - 1, -1, -1):
            # Calculate month
            target_month = current_date.month - i
            target_year = year
            
            if target_month <= 0:
                target_month += 12
                target_year -= 1
            
            month_start, month_end = self._get_month_range(target_month, target_year)
            
            # Stock Masuk (Purchasing)
            stock_masuk = (
                self.db.query(func.sum(PurchasingDetail.quantity))
                .join(Purchasing)
                .filter(Purchasing.date.between(month_start, month_end))
                .scalar() or 0
            )
            
            # Stock Keluar (Stock Movement)
            stock_keluar = (
                self.db.query(func.sum(StockMovementDetail.quantity))
                .join(StockMovement)
                .filter(StockMovement.date.between(month_start, month_end))
                .scalar() or 0
            )
            
            # Month label
            month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            
            result.append({
                "label": month_names[target_month - 1],
                "stockMasuk": float(stock_masuk),
                "stockKeluar": float(stock_keluar)
            })
        
        return result

    def _get_stock_by_product(self) -> List[Dict]:
        """
        Get stock distribution per product for donut chart
        Calculate current stock from Ledger
        """
        # Calculate stock balance per product (quantity_in - quantity_out)
        result = (
            self.db.query(
                Product.name,
                (func.sum(Ledger.quantity_in) - func.sum(Ledger.quantity_out)).label('balance')
            )
            .join(Ledger, Product.id == Ledger.product_id)
            .group_by(Product.id, Product.name)
            .having(func.sum(Ledger.quantity_in) - func.sum(Ledger.quantity_out) > 0)
            .order_by(desc('balance'))
            .limit(10)
            .all()
        )
        
        # Calculate total for percentage
        total = sum([float(r.balance) for r in result])
        
        if total == 0:
            return []
        
        return [
            {
                "label": r.name,
                "value": round((float(r.balance) / total) * 100, 1)
            }
            for r in result
        ]

    def _get_top_fast_moving_products(
        self, 
        start_date: datetime, 
        end_date: datetime,
        limit: int = 5
    ) -> List[Dict]:
        """
        Get top fast moving products (products that run out quickly)
        Based on quantity_out from Ledger
        """
        result = (
            self.db.query(
                Product.name,
                func.sum(Ledger.quantity_out).label('total_usage'),
                func.count(Ledger.id).label('transaction_count')
            )
            .join(Ledger, Product.id == Ledger.product_id)
            .filter(
                Ledger.date.between(start_date, end_date),
                Ledger.quantity_out > 0
            )
            .group_by(Product.id, Product.name)
            .order_by(desc('total_usage'))
            .limit(limit)
            .all()
        )
        
        # Find max usage for percentage calculation
        max_usage = max([float(r.total_usage) for r in result]) if result else 1
        
        return [
            {
                "label": r.name,
                "value": round((float(r.total_usage) / max_usage) * 100, 1),
                "maxValue": 100
            }
            for r in result
        ]

    def _get_design_cost_data(
        self, 
        start_date: datetime, 
        end_date: datetime,
        limit: int = 5
    ) -> List[Dict]:
        """
        Get design production cost data
        Calculate from Color Kitchen entries and product prices
        """
        # Get designs with their usage
        designs = (
            self.db.query(
                Design.code.label('design'),
                func.count(ColorKitchenEntry.id).label('orders')
            )
            .join(ColorKitchenEntry, Design.id == ColorKitchenEntry.design_id)
            .filter(ColorKitchenEntry.date.between(start_date, end_date))
            .group_by(Design.id, Design.code)
            .order_by(desc('orders'))
            .limit(limit)
            .all()
        )
        
        result = []
        for design in designs:
            # Calculate estimated cost for this design
            # Sum of (product usage * average product price)
            cost_query = (
                self.db.query(
                    func.sum(
                        ColorKitchenEntryDetail.quantity * 
                        func.coalesce(
                            self.db.query(func.avg(PurchasingDetail.price))
                            .filter(PurchasingDetail.product_id == ColorKitchenEntryDetail.product_id)
                            .scalar_subquery(),
                            0
                        )
                    )
                )
                .join(ColorKitchenEntry, ColorKitchenEntryDetail.color_kitchen_entry_id == ColorKitchenEntry.id)
                .join(Design, ColorKitchenEntry.design_id == Design.id)
                .filter(
                    Design.code == design.design,
                    ColorKitchenEntry.date.between(start_date, end_date)
                )
                .scalar() or 0
            )
            
            # Also add cost from batch dyestuff
            batch_cost_query = (
                self.db.query(
                    func.sum(
                        ColorKitchenBatchDetail.quantity * 
                        func.coalesce(
                            self.db.query(func.avg(PurchasingDetail.price))
                            .filter(PurchasingDetail.product_id == ColorKitchenBatchDetail.product_id)
                            .scalar_subquery(),
                            0
                        )
                    )
                )
                .join(ColorKitchenEntry, ColorKitchenBatchDetail.batch_id == ColorKitchenEntry.batch_id)
                .join(Design, ColorKitchenEntry.design_id == Design.id)
                .filter(
                    Design.code == design.design,
                    ColorKitchenEntry.date.between(start_date, end_date)
                )
                .scalar() or 0
            )
            
            total_cost = float(cost_query) + float(batch_cost_query)
            
            result.append({
                "design": design.design,
                "cost": round(total_cost, 0),
                "orders": design.orders
            })
        
        return result

    def _get_recent_transactions(self, limit: int = 10) -> Dict:
        """
        Get recent transactions from all processes (Purchasing, Stock Movement, Color Kitchen, Stock Opname)
        Returns data in table format (simple version for dashboard)
        """
        transactions = []
        
        # Get from Ledger (which records all movements)
        ledger_data = (
            self.db.query(
                Ledger.date,
                Ledger.ref,
                Ledger.ref_code,
                Product.name.label('product_name'),
                Ledger.quantity_in,
                Ledger.quantity_out,
                Ledger.location
            )
            .join(Product, Ledger.product_id == Product.id)
            .order_by(desc(Ledger.date))
            .limit(limit)
            .all()
        )
        
        for row in ledger_data:
            # Determine transaction type from ref
            type_mapping = {
                LedgerRef.PURCHASING: "Purchasing",
                LedgerRef.STOCK_MOVEMENT: "Stock Movement",
                LedgerRef.COLOR_KITCHEN: "Color Kitchen",
                LedgerRef.STOCK_OPNAME: "Stock Opname"
            }
            
            # Calculate net quantity (in - out)
            qty = float(row.quantity_in) - float(row.quantity_out)
            
            transactions.append({
                "id": len(transactions) + 1,
                "date": row.date.strftime("%Y-%m-%d") if row.date else "",
                "type": type_mapping.get(row.ref, "Unknown"),
                "ref": row.ref_code,
                "product": row.product_name,
                "qty": round(qty, 2),
                "location": row.location.value if row.location else ""
            })
        
        return {
            "rows": transactions,
            "total": len(transactions)
        }

    def get_transactions_paginated(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str = "",
        date_start: Optional[str] = None,
        date_end: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_dir: str = "desc"
    ) -> Dict:
        """
        Get transactions with full pagination support for Table component
        This is for the detailed transactions table with search, filter, sort, pagination
        """
        # Base query
        query = (
            self.db.query(
                Ledger.id,
                Ledger.date,
                Ledger.ref,
                Ledger.ref_code,
                Product.name.label('product_name'),
                Ledger.quantity_in,
                Ledger.quantity_out,
                Ledger.location
            )
            .join(Product, Ledger.product_id == Product.id)
        )

        # Search filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Ledger.ref_code.ilike(search_filter),
                    Product.name.ilike(search_filter),
                    Ledger.location.ilike(search_filter)
                )
            )

        # Date range filter
        if date_start:
            try:
                start_date = datetime.strptime(date_start, "%Y-%m-%d")
                query = query.filter(Ledger.date >= start_date)
            except ValueError:
                pass

        if date_end:
            try:
                end_date = datetime.strptime(date_end, "%Y-%m-%d")
                # Set to end of day
                end_date = end_date.replace(hour=23, minute=59, second=59)
                query = query.filter(Ledger.date <= end_date)
            except ValueError:
                pass

        # Get total count before pagination
        total = query.count()

        # Sorting
        if sort_by:
            if sort_by == "date":
                order_column = Ledger.date
            elif sort_by == "type":
                order_column = Ledger.ref
            elif sort_by == "ref":
                order_column = Ledger.ref_code
            elif sort_by == "product":
                order_column = Product.name
            elif sort_by == "location":
                order_column = Ledger.location
            else:
                order_column = Ledger.date
            
            if sort_dir == "desc":
                query = query.order_by(desc(order_column))
            else:
                query = query.order_by(order_column)
        else:
            query = query.order_by(desc(Ledger.date))

        # Pagination
        offset = (page - 1) * page_size
        ledger_data = query.offset(offset).limit(page_size).all()

        # Type mapping
        type_mapping = {
            LedgerRef.PURCHASING: "Purchasing",
            LedgerRef.STOCK_MOVEMENT: "Stock Movement",
            LedgerRef.COLOR_KITCHEN: "Color Kitchen",
            LedgerRef.STOCK_OPNAME: "Stock Opname"
        }

        # Format rows
        rows = []
        for row in ledger_data:
            qty = float(row.quantity_in) - float(row.quantity_out)
            
            rows.append({
                "id": row.id,
                "date": row.date.strftime("%Y-%m-%d") if row.date else "",
                "type": type_mapping.get(row.ref, "Unknown"),
                "ref": row.ref_code,
                "product": row.product_name,
                "qty": round(qty, 2),
                "location": row.location.value if row.location else ""
            })

        return {
            "rows": rows,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }