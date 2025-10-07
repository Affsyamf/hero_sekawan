from enum import Enum

class AccountType(str, Enum):
    Goods = 'goods'
    Service = 'service'