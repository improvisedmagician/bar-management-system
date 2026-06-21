import sqlite3

conn = sqlite3.connect('bar_management.db')
cursor = conn.cursor()

# Get Category IDs
cursor.execute("SELECT id, name FROM categories")
categories = {name: id for id, name in cursor.fetchall()}

bebidas_id = categories.get('Bebidas', 1)
comidas_id = categories.get('Comidas', 2)

products = [
    # Bebidas (Bar)
    ('Chopp Pilsen 500ml', 14.90, bebidas_id, -1),
    ('Caipirinha de Limão', 22.00, bebidas_id, -1),
    ('Refrigerante Lata', 7.50, bebidas_id, 100),
    ('Água com Gás', 5.00, bebidas_id, 50),
    ('Cerveja Artesanal IPA', 28.90, bebidas_id, 30),
    ('Moscow Mule', 32.00, bebidas_id, -1),
    
    # Comidas (Cozinha)
    ('Porção de Fritas com Cheddar', 45.00, comidas_id, -1),
    ('Escondidinho de Carne Seca', 55.00, comidas_id, 20),
    ('Hambúrguer Clássico', 38.00, comidas_id, -1),
    ('Iscas de Frango Empanadas', 42.00, comidas_id, -1),
    ('Tábua de Frios (2 pessoas)', 89.00, comidas_id, 15),
    ('Ceviche de Tilápia', 52.00, comidas_id, 10),
]

for p in products:
    cursor.execute(
        "INSERT INTO products (name, price, is_active, stock_quantity, category_id) VALUES (?, ?, 1, ?, ?)",
        (p[0], p[1], p[3], p[2])
    )

conn.commit()
conn.close()
print("Produtos de teste adicionados com sucesso!")
