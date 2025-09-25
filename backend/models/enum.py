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

class DesignKainType(str, Enum):
    Hyget = 'Hyget'
    DkPe40 = "DK PE' 40"
    Billabong = 'Billabong'
    BbTr = 'BB TR'
    Rasfur = 'RASFUR'
    Rib = 'Rib'
    PolyHanduk = 'Poly Handuk'
    Tc25 = "TC' 25"