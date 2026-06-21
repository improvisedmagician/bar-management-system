from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date

import models
from database import get_db

router = APIRouter(prefix="/admin", tags=["Admin Metrics"])

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    """Retorna as métricas em tempo real para o dashboard."""
    # Obter apenas pedidos do dia atual
    today = date.today()
    
    # 1. Obter Total de Pagamentos Hoje (Faturamento)
    payments_today = db.query(models.Payment).filter(func.date(models.Payment.created_at) == today).all()
    total_revenue = sum(p.amount for p in payments_today)
    
    # 2. Obter Total de Pedidos Concluídos (Fechados) Hoje
    completed_orders = db.query(models.Order).filter(
        func.date(models.Order.created_at) == today,
        models.Order.status == "Fechado"
    ).all()
    num_completed = len(completed_orders)
    
    # 3. Calcular Ticket Médio
    average_ticket = 0
    if num_completed > 0:
        average_ticket = total_revenue / num_completed

    # 4. Top Produtos
    # Buscar todos os itens de pedidos fechados hoje
    from collections import defaultdict
    product_sales = defaultdict(int)
    
    for order in completed_orders:
        for item in order.items:
            product_sales[item.product.name] += item.quantity
            
    top_products = [{"name": name, "amount": amount} for name, amount in product_sales.items()]
    top_products = sorted(top_products, key=lambda x: x["amount"], reverse=True)[:5] # Pegar os Top 5

    # 5. Vendas por Horário (Gráfico de Linha)
    sales_over_time_dict = defaultdict(float)
    for p in payments_today:
        hour_str = f"{p.created_at.hour:02d}:00"
        sales_over_time_dict[hour_str] += p.amount
        
    sales_over_time = [{"time": time, "total": total} for time, total in sales_over_time_dict.items()]
    sales_over_time = sorted(sales_over_time, key=lambda x: x["time"])
    
    return {
        "total_revenue": total_revenue,
        "average_ticket": average_ticket,
        "completed_orders": num_completed,
        "top_products": top_products,
        "sales_over_time": sales_over_time
    }
