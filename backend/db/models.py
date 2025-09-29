from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

from models.enum import LedgerRef, LedgerLocation

Base = declarative_base()

#region Master Data
class Supplier(Base):
    __tablename__ = 'suppliers'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    contact_info = Column(Text, nullable=True)

    purchasings = relationship("Purchasing", back_populates="supplier")

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=True, unique=True)
    name = Column(String, nullable=False, unique=True)
    unit = Column(String, nullable=True)

    account_id = Column(Integer, ForeignKey('accounts.id'))
    account = relationship("Account", back_populates="products")

    purchasing_details = relationship("Purchasing_Detail", back_populates="product")
    stock_movement_details = relationship("Stock_Movement_Detail", back_populates="product")
    color_kitchen_details = relationship("Color_Kitchen_Detail", back_populates="product")
    ledger_entries = relationship("Ledger", back_populates="product")

class Design(Base):
    __tablename__ = 'designs'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    
    type_id = Column(Integer, ForeignKey("design_types.id"), nullable=False)
    type = relationship("Design_Type", back_populates="designs")

    color_kitchen_entries = relationship("Color_Kitchen_Entry", back_populates="design")
#endregion Master Data

#region Types
class Account(Base):
    __tablename__ = 'accounts'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    account_no = Column(Numeric, nullable=False, unique=True, index=True)
    alias = Column(String, nullable=True)
    
    products = relationship("Product", back_populates="account")
    
class Design_Type(Base):
    __tablename__ = "design_types"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    
    designs = relationship("Design", back_populates="type")
#endregion Types

#region Ledger
class Ledger(Base):
    __tablename__ = 'ledgers'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    ref = Column(SQLAlchemyEnum(LedgerRef), nullable=False)
    ref_code = Column(String, nullable=False)
    location = Column(SQLAlchemyEnum(LedgerLocation), nullable=False)
    qty_in = Column(Float, default=0.0)
    qty_out = Column(Float, default=0.0)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="ledger_entries")
#endregion Ledger

#region Purchasing
class Purchasing(Base):
    __tablename__ = 'purchasings'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=True) # No Bukti
    purchase_order = Column(String, nullable=True) # PO Number

    supplier_id = Column(Integer, ForeignKey('suppliers.id'), nullable=False)
    supplier = relationship("Supplier", back_populates="purchasings")

    # purchase_order_id = Column(Intege) # Future relation to PurchaseOrder if needed

    details = relationship("Purchasing_Detail", back_populates="purchasing")


class Purchasing_Detail(Base):
    __tablename__ = 'purchasing_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    ppn = Column(Float, default=0.0)
    dpp = Column(Float, default=0.0)
    tax_no = Column(String, nullable=True) # No Faktur Pajak
    exchange_rate = Column(Float, default=0.0)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="purchasing_details")

    purchasing_id = Column(Integer, ForeignKey('purchasings.id'), nullable=False)
    purchasing = relationship("Purchasing", back_populates="details")
#endregion Purchasing

#region Stock
class Stock_Movement(Base):
    __tablename__ = 'stock_movements'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)

    details = relationship("Stock_Movement_Detail", back_populates="stock_movement")

class Stock_Movement_Detail(Base):
    __tablename__ = 'stock_movement_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Float, nullable=False)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="stock_movement_details")

    stock_movement_id = Column(Integer, ForeignKey('stock_movements.id'), nullable=False)
    stock_movement = relationship("Stock_Movement", back_populates="details")
#endregion Stock

#region Color Kitchen
class Color_Kitchen_Entry(Base):
    __tablename__ = 'color_kitchen_entries'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False) # NO OPJ
    quantity = Column(Float, nullable=False)
    paste_quantity = Column(Float, nullable=False)

    design_id = Column(Integer, ForeignKey('designs.id'), nullable=False)
    design = relationship("Design", back_populates="color_kitchen_entries")

    details = relationship("Color_Kitchen_Detail", back_populates="color_kitchen_entry")

class Color_Kitchen_Detail(Base):
    __tablename__ = 'color_kitchen_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Float, nullable=False)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="color_kitchen_details")

    color_kitchen_entry_id = Column(Integer, ForeignKey('color_kitchen_entries.id'), nullable=False)
    color_kitchen_entry = relationship("Color_Kitchen_Entry", back_populates="details")
#endregion Color Kitchen
