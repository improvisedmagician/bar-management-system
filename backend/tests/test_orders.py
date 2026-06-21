def test_create_order(client):
    table_response = client.post("/tables/", json={"number": 10})
    table_id = table_response.json()["id"]

    response = client.post("/orders/", json={"table_id": table_id})
    assert response.status_code == 200
    data = response.json()
    assert data["table_id"] == table_id
    assert data["status"] == "Aberto"
    assert "id" in data

    # Check table status was updated
    tables_response = client.get("/tables/")
    tables = tables_response.json()
    table = next((t for t in tables if t["id"] == table_id), None)
    assert table["status"] == "Ocupada"

def test_create_order_duplicate(client):
    table_response = client.post("/tables/", json={"number": 11})
    table_id = table_response.json()["id"]

    # First order
    order1 = client.post("/orders/", json={"table_id": table_id}).json()
    
    # Second order on same table while "Aberto"
    order2 = client.post("/orders/", json={"table_id": table_id}).json()
    
    # Should return the same existing order instead of creating new
    assert order1["id"] == order2["id"]

def test_read_orders(client):
    table_response = client.post("/tables/", json={"number": 12})
    client.post("/orders/", json={"table_id": table_response.json()["id"]})
    
    response = client.get("/orders/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

    # Filter by status
    response_aberto = client.get("/orders/?status=Aberto")
    assert response_aberto.status_code == 200
    assert len(response_aberto.json()) >= 1

def test_add_item_to_order(client):
    # Setup Table and Order
    table = client.post("/tables/", json={"number": 13}).json()
    order = client.post("/orders/", json={"table_id": table["id"]}).json()
    
    # Setup Category and Product
    cat = client.post("/menu/categories", json={"name": "Extra", "type": "food"}).json()
    prod = client.post("/menu/products", json={"name": "Batata", "price": 10.0, "category_id": cat["id"]}).json()

    # Add Item
    response = client.post(f"/orders/{order['id']}/items", json={
        "product_id": prod["id"],
        "quantity": 2,
        "observations": "Sem sal"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == prod["id"]
    assert data["quantity"] == 2
    assert data["observations"] == "Sem sal"
    assert data["order_id"] == order["id"]

def test_add_item_not_found_order(client):
    response = client.post("/orders/99999/items", json={
        "product_id": 1,
        "quantity": 1
    })
    assert response.status_code == 404
    assert response.json() == {"detail": "Pedido não encontrado"}
