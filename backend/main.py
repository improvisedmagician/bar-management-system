from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
from database import engine, get_db
from routers import menu, tables, orders, auth, websockets, cash_register, admin

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

app.include_router(auth.router)
app.include_router(websockets.router)
app.include_router(menu.router)
app.include_router(tables.router)
app.include_router(orders.router)
app.include_router(cash_register.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Bar Management System API is running"}

