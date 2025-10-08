CREATE MATERIALIZED VIEW IF NOT EXISTS product_avg_cost AS
WITH cumulative AS (
    SELECT
        pd.product_id,
        SUM(pd.quantity) AS total_qty_in,
        SUM(pd.quantity * pd.price) AS total_value_in
    FROM purchasing_details pd
    JOIN purchasings p ON p.id = pd.purchasing_id
    WHERE pd.price IS NOT NULL
    GROUP BY pd.product_id
),
movements AS (
    SELECT
        smd.product_id,
        SUM(smd.quantity) AS total_qty_out,
        SUM(smd.quantity * smd.unit_cost_used) AS total_value_out
    FROM stock_movement_details smd
    JOIN stock_movements sm ON sm.id = smd.stock_movement_id
    GROUP BY smd.product_id
),
opnames AS (
    SELECT
        sod.product_id,
        SUM(sod.difference) AS total_qty_adj,
        SUM(sod.difference * COALESCE(pacc.avg_cost, 0)) AS total_value_adj
    FROM stock_opname_details sod
    JOIN stock_opnames so ON so.id = sod.stock_opname_id
    LEFT JOIN product_avg_cost_cache pacc ON pacc.product_id = sod.product_id
    GROUP BY sod.product_id
)
SELECT
    c.product_id,
    (COALESCE(c.total_qty_in, 0)
     - COALESCE(m.total_qty_out, 0)
     + COALESCE(o.total_qty_adj, 0)) AS stock_qty,
    (COALESCE(c.total_value_in, 0)
     - COALESCE(m.total_value_out, 0)
     + COALESCE(o.total_value_adj, 0)) AS stock_value,
    CASE
        WHEN (COALESCE(c.total_qty_in, 0)
              - COALESCE(m.total_qty_out, 0)
              + COALESCE(o.total_qty_adj, 0)) > 0
        THEN
            (COALESCE(c.total_value_in, 0)
             - COALESCE(m.total_value_out, 0)
             + COALESCE(o.total_value_adj, 0))
            / (COALESCE(c.total_qty_in, 0)
               - COALESCE(m.total_qty_out, 0)
               + COALESCE(o.total_qty_adj, 0))
        ELSE 0
    END AS avg_cost
FROM cumulative c
LEFT JOIN movements m ON m.product_id = c.product_id
LEFT JOIN opnames o ON o.product_id = c.product_id;
