def test_list_resources_paginated(client):
    response = client.get("/api/v1/resources?page=1&page_size=5")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "items" in res["data"]
    assert "total" in res["data"]
    assert len(res["data"]["items"]) <= 5

def test_create_resource_validation(client):
    # Test negative quantity rejection
    payload = {
        "owner_id": 1,
        "type": "FOOD",
        "title": "Invalid Rice",
        "quantity": -10.0,
        "unit": "bags",
        "location": "Ludhiana",
        "latitude": 30.9,
        "longitude": 75.8
    }
    response = client.post("/api/v1/resources", json=payload)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_QUANTITY"

def test_deactivate_resource(client):
    # Create valid resource first
    payload = {
        "owner_id": 1,
        "type": "WATER",
        "title": "Water Tanker for Deactivation",
        "quantity": 100.0,
        "unit": "liters",
        "location": "Patiala",
        "latitude": 30.3,
        "longitude": 76.3
    }
    create_resp = client.post("/api/v1/resources", json=payload)
    res_id = create_resp.json()["data"]["id"]

    # Deactivate resource
    delete_resp = client.delete(f"/api/v1/resources/{res_id}")
    assert delete_resp.status_code == 200

    # Verify status changed to EXHAUSTED
    get_resp = client.get(f"/api/v1/resources/{res_id}")
    assert get_resp.json()["data"]["availability_status"] == "EXHAUSTED"
