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
    
class AccountType(str, Enum):
    Goods = 'goods'
    Service = 'service'

# class DesignKainType(str, Enum):
#     Hyget = 'Hyget'
#     DkPe40 = "DK PE 40"
#     Billabong = 'Billabong'
#     BbTr = 'BB TR'
#     Rasfur = 'RASFUR'
#     Rib = 'Rib'
#     PolyHanduk = 'POLY HANDUK'
#     Tc25 = "TC 25"
#     Pe30 = "PE 30"
#     Pe20 = "PE 20"