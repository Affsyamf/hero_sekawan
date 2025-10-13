from sqlalchemy import func, select, text
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.engine import Connection, Engine

from app.models import ProductAvgCost, PurchasingDetail, Purchasing, ProductAvgCostCache

def refresh_product_avg_cost(db: Session):
    """
    Refresh the materialized view 'product_avg_cost' (blocking version).
    Use this when you do NOT have a unique index on the view.
    """
    try:
        db.execute(text("REFRESH MATERIALIZED VIEW product_avg_cost;"))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed: {e}")
        raise

def get_avg_cost_for_product(db: Session, product_id: int) -> float | None:
    """Return the precomputed average cost for a product from the materialized view."""
    result = (
        db.query(ProductAvgCost)
        .filter(ProductAvgCost.product_id == product_id)
        .first()
    )
    return result.avg_cost if result else None

def update_avg_cost_for_products(conn_or_engine, product_ids: list[int]):
    """
    Recompute avg cost for one or many products using a single raw SQL upsert.
    Works with both a Connection or Engine.
    """
    if not product_ids:
        return

    sql = text("""
        INSERT INTO product_avg_cost_cache (product_id, total_qty_in, total_value_in, avg_cost, last_updated)
        SELECT
            pd.product_id,
            SUM(pd.quantity) AS total_qty_in,
            SUM(pd.quantity * pd.price) AS total_value_in,
            CASE WHEN SUM(pd.quantity) > 0 THEN
                SUM(pd.quantity * pd.price) / SUM(pd.quantity)
            ELSE 0 END AS avg_cost,
            NOW()
        FROM purchasing_details pd
        WHERE pd.product_id = ANY(:pids)
        GROUP BY pd.product_id
        ON CONFLICT (product_id) DO UPDATE
        SET
            total_qty_in = EXCLUDED.total_qty_in,
            total_value_in = EXCLUDED.total_value_in,
            avg_cost = EXCLUDED.avg_cost,
            last_updated = NOW();
    """)

    # Accept both Connection and Engine
    if isinstance(conn_or_engine, Engine):
        with conn_or_engine.begin() as conn:
            conn.execute(sql, {"pids": product_ids})
    elif isinstance(conn_or_engine, Connection):
        conn_or_engine.execute(sql, {"pids": product_ids})
    else:
        raise TypeError("update_avg_cost_for_products expects a Connection or Engine")

    