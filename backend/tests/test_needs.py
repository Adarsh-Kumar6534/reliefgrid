def test_list_needs_paginated(client):
    response = client.get("/api/v1/needs?page=1&page_size=5")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "items" in res["data"]
    assert len(res["data"]["items"]) <= 5

def test_create_need_validation(client):
    payload = {
        "requester_id": 1,
        "type": "FOOD",
        "title": "Invalid Negative Need",
        "quantity_required": -50.0,
        "unit": "packets",
        "location": "Ludhiana",
        "latitude": 30.9,
        "longitude": 75.8
    }
    response = client.post("/api/v1/needs", json=payload)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_QUANTITY"

def test_global_search_api(client):
    response = client.get("/api/v1/search?q=Ludhiana")
    assert response.status_code == 200
    data = response.json()["data"]
    assert "resources" in data
    assert "needs" in data
