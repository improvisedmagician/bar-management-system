from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

import models
import schemas
from database import get_db

router = APIRouter(prefix="/cash-register", tags=["Cash Register"])

@router.get("/current", response_model=Optional[schemas.CashRegister])
def get_current_cash_register(db: Session = Depends(get_db)):
    """Retorna o caixa atualmente aberto, se houver."""
    cr = db.query(models.CashRegister).filter(models.CashRegister.status == "Aberto").first()
    return cr

@router.post("/open", response_model=schemas.CashRegister)
def open_cash_register(cr_create: schemas.CashRegisterCreate, db: Session = Depends(get_db)):
    """Abre um novo caixa com um saldo inicial (Fundo de Troco)."""
    current = db.query(models.CashRegister).filter(models.CashRegister.status == "Aberto").first()
    if current:
        raise HTTPException(status_code=400, detail="Já existe um caixa aberto no momento.")
        
    new_cr = models.CashRegister(
        initial_balance=cr_create.initial_balance,
        current_balance=cr_create.initial_balance,
        status="Aberto"
    )
    db.add(new_cr)
    db.commit()
    db.refresh(new_cr)
    return new_cr

@router.post("/close", response_model=schemas.CashRegister)
def close_cash_register(db: Session = Depends(get_db)):
    """Fecha o caixa atual, calculando o saldo total baseado nos pagamentos registrados."""
    cr = db.query(models.CashRegister).filter(models.CashRegister.status == "Aberto").first()
    if not cr:
        raise HTTPException(status_code=400, detail="Não há caixa aberto no momento.")
        
    # Somar todos os pagamentos realizados desde a abertura deste caixa
    payments = db.query(models.Payment).filter(models.Payment.created_at >= cr.opened_at).all()
    total_sales = sum(p.amount for p in payments)
    
    cr.current_balance = cr.initial_balance + total_sales
    cr.status = "Fechado"
    cr.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(cr)
    return cr
