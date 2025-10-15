from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    ColorKitchenBatch as CKBatch,
    ColorKitchenEntry as CKEntry,
    ColorKitchenEntryDetail as CKEntryDetail,
)
from app.services.reporting.base_reporting_service import BaseReportService

from app.utils.response import APIResponse

class ColorKitchenSummaryService(BaseReportService):
    """
    Service for generating top-level Color Kitchen Production KPIs.
    - Total Batches
    - Total Entries
    - Total Rolls Processed
    - Average Cost per Batch
    - Average Cost per Entry
    """

    def run(self, filters):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta=filters,
            data=self._get_summary(filters)
        ) 

    # ------------------------------------------------------
    # internal summary logic
    # ------------------------------------------------------
    def _get_summary(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        # ----------------------------------------------
        # Totals
        # ----------------------------------------------
        # Total batches
        q_batches = db.query(func.count(func.distinct(CKBatch.id)))
        if start_date:
            q_batches = q_batches.filter(CKBatch.date >= start_date)
        if end_date:
            q_batches = q_batches.filter(CKBatch.date <= end_date)
        total_batches = q_batches.scalar() or 0

        # Total entries
        q_entries = db.query(func.count(CKEntry.id))
        if start_date:
            q_entries = q_entries.filter(CKEntry.date >= start_date)
        if end_date:
            q_entries = q_entries.filter(CKEntry.date <= end_date)
        total_entries = q_entries.scalar() or 0

        # Total rolls processed
        q_rolls = db.query(func.coalesce(func.sum(CKEntry.rolls), 0))
        if start_date:
            q_rolls = q_rolls.filter(CKEntry.date >= start_date)
        if end_date:
            q_rolls = q_rolls.filter(CKEntry.date <= end_date)
        total_rolls_processed = q_rolls.scalar() or 0

        # ----------------------------------------------
        # Total cost
        # ----------------------------------------------
        q_cost = (
            db.query(
                func.coalesce(
                    func.sum(CKEntryDetail.quantity * func.coalesce(CKEntryDetail.unit_cost_used, 0.0)),
                    0.0,
                ).label("total_cost")
            )
            .select_from(CKEntryDetail)
            .join(CKEntry, CKEntry.id == CKEntryDetail.color_kitchen_entry_id)
            .join(CKBatch, CKBatch.id == CKEntry.batch_id)
        )
        if start_date:
            q_cost = q_cost.filter(CKBatch.date >= start_date)
        if end_date:
            q_cost = q_cost.filter(CKBatch.date <= end_date)
        total_cost = q_cost.scalar() or 0.0

        # ----------------------------------------------
        # Derived averages
        # ----------------------------------------------
        avg_cost_per_batch = total_cost / total_batches if total_batches else 0
        avg_cost_per_entry = total_cost / total_entries if total_entries else 0

        # ----------------------------------------------
        # Final result
        # ----------------------------------------------
        return {
            "total_batches": int(total_batches),
            "total_entries": int(total_entries),
            "total_rolls_processed": int(total_rolls_processed),
            "avg_cost_per_batch": round(avg_cost_per_batch, 2),
            "avg_cost_per_entry": round(avg_cost_per_entry, 2),
            "total_cost": round(total_cost, 2),
        }
