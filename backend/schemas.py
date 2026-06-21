from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    role: str = "Garçom"

class UserCreate(UserBase):
    pin: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    price: float
    is_active: bool = True
    stock_quantity: int = -1
    category_id: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    category: Optional['CategoryBase'] = None
    model_config = ConfigDict(from_attributes=True)

class CategoryBase(BaseModel):
    name: str
    type: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    products: List[Product] = []
    model_config = ConfigDict(from_attributes=True)

class TableBase(BaseModel):
    number: int
    status: str = "Livre"
    current_waiter_id: Optional[int] = None

class TableCreate(TableBase):
    pass

class Table(TableBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = 1
    observations: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    status: str
    canceled_by: Optional[int] = None
    created_at: datetime
    product: Product
    model_config = ConfigDict(from_attributes=True)

class PaymentBase(BaseModel):
    amount: float
    method: str

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    order_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    table_id: int
    waiter_id: Optional[int] = None

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    status: str
    created_at: datetime
    items: List[OrderItem] = []
    payments: List[Payment] = []
    table: Table
    model_config = ConfigDict(from_attributes=True)

class CashRegisterBase(BaseModel):
    initial_balance: float = 0.0

class CashRegisterCreate(CashRegisterBase):
    pass

class CashRegister(CashRegisterBase):
    id: int
    current_balance: float
    status: str
    opened_at: datetime
    closed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
