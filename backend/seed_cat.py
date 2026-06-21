import sqlite3
conn = sqlite3.connect('bar_management.db')
cursor = conn.cursor()
cursor.execute("INSERT INTO categories (name, type) VALUES ('Bebidas', 'Bar')")
cursor.execute("INSERT INTO categories (name, type) VALUES ('Comidas', 'Cozinha')")
conn.commit()
conn.close()
