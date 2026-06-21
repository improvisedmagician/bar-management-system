from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter(prefix="/tables", tags=["Tables"])

@router.get("/", response_model=List[schemas.Table])
def read_tables(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tables = db.query(models.Table).offset(skip).limit(limit).all()
    return tables

@router.post("/", response_model=schemas.Table)
def create_table(table: schemas.TableCreate, db: Session = Depends(get_db)):
    db_table = db.query(models.Table).filter(models.Table.number == table.number).first()
    if db_table:
        raise HTTPException(status_code=400, detail="Mesa já cadastrada")
    
    new_table = models.Table(**table.model_dump())
    db.add(new_table)
    db.commit()
    db.refresh(new_table)
    return new_table
