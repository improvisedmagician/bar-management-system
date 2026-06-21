from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    pin: str = None
    password: str = None
    name: str = None

@router.post("/login", response_model=schemas.User)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Login via PIN (Garçom) - Mantido para compatibilidade, caso necessário
    if request.pin:
        user = db.query(models.User).filter(models.User.pin == request.pin).first()
        if not user:
            raise HTTPException(status_code=401, detail="PIN inválido")
        return user
    
    # Login via Nome (Garçom - Sem Senha)
    if request.name and not request.password:
        user = db.query(models.User).filter(models.User.name == request.name).first()
        if not user or user.role != "Garçom":
            raise HTTPException(status_code=401, detail="Usuário não encontrado ou não tem permissão para logar sem senha")
        return user

    # Login via Senha (Admin / Outros)
    if request.name and request.password:
        user = db.query(models.User).filter(models.User.name == request.name).first()
        if not user or not user.password_hash:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        if not pwd_context.verify(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        return user

    raise HTTPException(status_code=400, detail="Forneça Nome, PIN ou (Nome e Senha)")

@router.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.pin:
        existing = db.query(models.User).filter(models.User.pin == user.pin).first()
        if existing:
            raise HTTPException(status_code=400, detail="Este PIN já está em uso por outro usuário.")

    db_user = models.User(
        name=user.name,
        role=user.role,
        pin=user.pin if user.pin else None
    )
    if user.password:
        db_user.password_hash = pwd_context.hash(user.password)
        
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users", response_model=list[schemas.User])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()
