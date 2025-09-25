from enum import Enum

class LedgerRef(str, Enum):
    Purchasing = 'purchasing'
    Ck = 'ck'
    StockMovement = 'stock_movement'
    StockOpname = 'stock_opname'

class LedgerLocation(str, Enum):
    Gudang = 'gudang'
    Kitchen = 'kitchen'
    Usage = 'usage'
    Opname = 'opname'