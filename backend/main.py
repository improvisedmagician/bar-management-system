from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import engine, get_db
from routers import menu, tables, orders, auth, cash_register, admin

# Cria as tabelas no banco de dados local
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bar Management System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, adicionar o domínio real do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import APIRouter

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(menu.router)
api_router.include_router(tables.router)
api_router.include_router(orders.router)
api_router.include_router(cash_register.router)
api_router.include_router(admin.router)

app.include_router(api_router)
@app.get("/")
def read_root():
    return {"status": "ok", "message": "Bar Management System API is running"}

