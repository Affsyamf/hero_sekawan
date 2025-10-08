from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

from .master import *
from .ledger import *
from .purchasing import *
from .stock_movement import *
from .color_kitchen import *
from .stock_opname import *
from .types import *
from .analytics.product_avg_cost import *
from .cache.product_avg_cost_cache import ProductAvgCostCache

__all__ = [
    "Base",
    # master.py
    "Supplier", "Product", "Design",
    # ledger.py
    "Ledger",
    # purchasing.py
    "Purchasing", "Purchasing_Detail",
    # stock_movement.py
    "Stock_Movement", "Stock_Movement_Detail",
    # color_kitchen.py
    "Color_Kitchen_Batch", "Color_Kitchen_Batch_Detail",
    "Color_Kitchen_Entry", "Color_Kitchen_Entry_Detail",
    # stock_opname.py
    "Stock_Opname", "Stock_Opname_Detail",
    # types.py
    "Account", "Design_Type",
    # product_avg_cost.py
    "ProductAvgCost",
    # product_avg_cost_cache.py
    "ProductAvgCostCache",
]