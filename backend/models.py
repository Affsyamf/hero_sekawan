from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

#region Master Data
class Supplier(Base):
    __tablename__ = 'suppliers'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    contact_info = Column(Text, nullable=True)

    purchasings = relationship("Purchasing", back_populates="supplier")

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=True)

    account_id = Column(Integer, ForeignKey('accounts.id'))
    account = relationship("Account", back_populates="products")

    details = relationship("PurchasingDetail", back_populates="product")
#endregion Master Data

#region Types
class Account(Base):
    __tablename__ = 'accounts'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)

    products = relationship("Product", back_populates="account")
#endregion Types

#region Purchasing
class Purchasing(Base):
    __tablename__ = 'purchasings'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    
    supplier_id = Column(Integer, ForeignKey('suppliers.id'), nullable=False)
    supplier = relationship("Supplier", back_populates="purchasings")

    details = relationship("PurchasingDetail", back_populates="purchasing")


class PurchasingDetail(Base):
    __tablename__ = 'purchasing_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Float, nullable=False)
    price_per_unit = Column(Float, nullable=False)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="details")

    purchasing_id = Column(Integer, ForeignKey('purchasings.id'), nullable=False)
    purchasing = relationship("Purchasing", back_populates="details")
#endregion Purchasing

#region Stock
class StockMovement(Base):
    __tablename__ = 'stock_movements'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)

    details = relationship("StockMovementDetail", back_populates="stock_movement")

class StockMovementDetail(Base):
    __tablename__ = 'stock_movement_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Float, nullable=False)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="stock_movement_details")

    stock_movement_id = Column(Integer, ForeignKey('stock_movements.id'), nullable=False)
    stock_movement = relationship("StockMovement", back_populates="details")
#endregion Stock

#region Color Kitchen
class ColorKitchenEntry(Base):
    __tablename__ = 'color_kitchen_entries'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)
    
    details = relationship("ColorKitchenDetail", back_populates="color_kitchen_entry")

class ColorKitchenDetail(Base):
    __tablename__ = 'color_kitchen_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Float, nullable=False)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="color_kitchen_details")

    color_kitchen_entry_id = Column(Integer, ForeignKey('color_kitchen_entries.id'), nullable=False)
    color_kitchen_entry = relationship("ColorKitchenEntry", back_populates="details")
#endregion Color Kitchen