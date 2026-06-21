def test_create_category(client):
    response = client.post("/menu/categories", json={"name": "Bebidas", "type": "drink"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Bebidas"
    assert data["type"] == "drink"
    assert "id" in data

def test_read_categories(client):
    client.post("/menu/categories", json={"name": "Comidas", "type": "food"})
    response = client.get("/menu/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(c["name"] == "Comidas" for c in data)

def test_create_product(client):
    cat_response = client.post("/menu/categories", json={"name": "Sobremesas", "type": "dessert"})
    cat_id = cat_response.json()["id"]

    response = client.post("/menu/products", json={
        "name": "Pudim",
        "price": 10.50,
        "is_active": True,
        "category_id": cat_id
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Pudim"
    assert data["price"] == 10.50
    assert data["category_id"] == cat_id
    assert "id" in data

def test_read_products(client):
    cat_response = client.post("/menu/categories", json={"name": "Salgados", "type": "food"})
    cat_id = cat_response.json()["id"]

    client.post("/menu/products", json={
        "name": "Coxinha",
        "price": 5.0,
        "is_active": True,
        "category_id": cat_id
    })
    
    # Test read all
    response = client.get("/menu/products")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    
    # Test read filtered by category
    response = client.get(f"/menu/products?category_id={cat_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["category_id"] == cat_id
