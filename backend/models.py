from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, index=True)
    status = Column(String, default="Livre") # Livre, Ocupada, Aguardando Fechamento
    current_waiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    orders = relationship("Order", back_populates="table")
    current_waiter = relationship("User")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Bebidas, Petiscos, Pratos
    type = Column(String) # Bar, Cozinha (para o roteamento do KDS)
    
    products = relationship("Product", back_populates="category")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    pin = Column(String, unique=True, index=True, nullable=True) # Para garçons
    password_hash = Column(String, nullable=True) # Para admins
    role = Column(String, default="Garçom") # Admin, Garçom, Caixa, Cozinha

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    is_active = Column(Boolean, default=True)
    stock_quantity = Column(Integer, default=-1) # -1 = infinito/não gerencia estoque
    category_id = Column(Integer, ForeignKey("categories.id"))

    category = relationship("Category", back_populates="products")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"))
    status = Column(String, default="Aberto") # Aberto, Fechado
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    table = relationship("Table", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payments = relationship("Payment", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    observations = Column(String, nullable=True) # Ex: "Sem cebola"
    status = Column(String, default="Na Fila") # Na Fila, Em Preparo, Pronto, Entregue, Cancelado
    canceled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    amount = Column(Float)
    method = Column(String) # Dinheiro, Cartão, Pix
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="payments")

class CashRegister(Base):
    __tablename__ = "cash_registers"

    id = Column(Integer, primary_key=True, index=True)
    opened_at = Column(DateTime, default=datetime.datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    initial_balance = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    status = Column(String, default="Aberto") # Aberto, Fechado
