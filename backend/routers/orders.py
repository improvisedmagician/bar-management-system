from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

import models
import schemas
from database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("/", response_model=List[schemas.Order])
def read_orders(status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.status == status)
    return query.all()

@router.post("/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(
        models.Order.table_id == order.table_id,
        models.Order.status == "Aberto"
    ).first()
    
    if not db_order:
        db_order = models.Order(table_id=order.table_id)
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        table = db.query(models.Table).filter(models.Table.id == order.table_id).first()
        if table:
            table.status = "Ocupada"
            if order.waiter_id:
                table.current_waiter_id = order.waiter_id
            db.commit()
            
    return db_order

@router.post("/{order_id}/items", response_model=schemas.OrderItem)
def add_item_to_order(order_id: int, item: schemas.OrderItemCreate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
        
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    
    # Bebidas do bar não precisam de preparo
    initial_status = "Na Fila"
    destination = product.category.type if product and product.category else "Bar"
    if destination == "Bar":
        initial_status = "Pronto"

    db_item = models.OrderItem(
        order_id=order_id,
        product_id=item.product_id,
        quantity=item.quantity,
        observations=item.observations,
        status=initial_status
    )
    db.add(db_item)
    
    # Atualiza o estoque do produto
    if product and product.stock_quantity > 0:
        product.stock_quantity -= item.quantity
    
    db.commit()
    db.refresh(db_item)
    
    return db_item

@router.put("/{order_id}/items/{item_id}/status")
def update_item_status(order_id: int, item_id: int, status: str, db: Session = Depends(get_db)):
    item = db.query(models.OrderItem).filter(models.OrderItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    item.status = status
    db.commit()
    
    return {"status": "success"}

@router.post("/{order_id}/pay", response_model=schemas.Payment)
def pay_order(order_id: int, payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
        
    db_payment = models.Payment(**payment.model_dump(), order_id=order_id)
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.post("/{order_id}/close")
def close_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    order.status = "Fechado"
    
    # Liberar a mesa
    if order.table:
        order.table.status = "Livre"
        order.table.current_waiter_id = None
        
    db.commit()
    return {"status": "success", "message": "Pedido fechado e mesa liberada"}

@router.post("/{order_id}/transfer")
def transfer_order(order_id: int, new_table_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    new_table = db.query(models.Table).filter(models.Table.id == new_table_id).first()
    if not new_table:
        raise HTTPException(status_code=404, detail="Mesa destino não encontrada")
    if new_table.status != "Livre":
        raise HTTPException(status_code=400, detail="Mesa destino não está livre")
        
    # Libera a mesa antiga
    old_table = order.table
    if old_table:
        old_table.status = "Livre"
        old_table.current_waiter_id = None
        
    # Ocupa a mesa nova e atualiza o pedido
    new_table.status = "Ocupada"
    new_table.current_waiter_id = old_table.current_waiter_id if old_table else None
    order.table_id = new_table_id
    
    db.commit()
    return {"status": "success", "message": f"Mesa transferida para {new_table.number}"}
