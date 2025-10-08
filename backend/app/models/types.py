from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base
from app.models.enum.account_enum import AccountType
from app.models.enum.registry import enum_column

class Account(Base):
    __tablename__ = 'accounts'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    account_no = Column(Numeric, nullable=False, unique=True, index=True)
    account_type = Column(enum_column(AccountType, name='account_type_enum'), nullable=False)
    alias = Column(String, nullable=True)
    
    products = relationship("Product", back_populates="account")
    
class DesignType(Base):
    __tablename__ = "design_types"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    
    designs = relationship("Design", back_populates="type")