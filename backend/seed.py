import sqlite3

conn = sqlite3.connect('bar_management.db')
cursor = conn.cursor()

# Inserir Garçom
cursor.execute("INSERT INTO users (name, role, pin, password_hash) VALUES ('Joao', 'Garçom', '1234', '')")
cursor.execute("INSERT INTO users (name, role, pin, password_hash) VALUES ('Admin', 'Admin', '', '$2b$12$K8d2bL/nB1s/L2U3Xk/EseR5hA8E/P7P.Y.Zt0/A1c/H/J.K/L.M.')")

# Inserir Mesa
for i in range(1, 11):
    cursor.execute(f"INSERT INTO tables (number, status) VALUES ({i}, 'Livre')")

conn.commit()
conn.close()
print("Dados criados com sucesso!")
