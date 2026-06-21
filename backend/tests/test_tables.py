def test_create_table(client):
    response = client.post("/tables/", json={"number": 1})
    assert response.status_code == 200
    data = response.json()
    assert data["number"] == 1
    assert data["status"] == "Livre"
    assert "id" in data

def test_create_table_duplicate(client):
    # Create first table
    client.post("/tables/", json={"number": 2})
    # Try to create again
    response = client.post("/tables/", json={"number": 2})
    assert response.status_code == 400
    assert response.json() == {"detail": "Mesa já cadastrada"}

def test_read_tables(client):
    client.post("/tables/", json={"number": 3})
    client.post("/tables/", json={"number": 4})
    
    response = client.get("/tables/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    numbers = [t["number"] for t in data]
    assert 3 in numbers
    assert 4 in numbers
