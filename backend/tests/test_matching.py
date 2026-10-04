from app.services.matching_engine import haversine_distance, MatchingEngine
from app.models.domain import Need, Resource, Match

def test_haversine_distance():
    # Distance between Ludhiana (30.9010, 75.8573) and Chandigarh (30.7333, 76.7794) ~ 90 km
    dist = haversine_distance(30.9010, 75.8573, 30.7333, 76.7794)
    assert 80.0 < dist < 100.0

def test_matching_engine_scoring_100pt():
    need = Need(
        type="FOOD",
        quantity_required=100.0,
        unit="packets",
        latitude=30.9010,
        longitude=75.8573,
        priority="CRITICAL"
    )
    resource = Resource(
        type="FOOD",
        quantity=200.0,
        unit="packets",
        latitude=30.9050,
        longitude=75.8500,
        availability_status="AVAILABLE"
    )
    score, distance, reasons = MatchingEngine.calculate_match_score(need, resource)
    # Category (40) + Active (10) + Proximity (20) + Quantity (20) + Critical (10) = 100
    assert score == 100.0
    assert distance < 5.0
    assert any("Category matched: FOOD (+40 pts)" in r for r in reasons)

def test_matching_unavailable_exclusion():
    need = Need(type="FOOD", quantity_required=50.0, latitude=30.9, longitude=75.8, priority="HIGH")
    resource = Resource(type="FOOD", quantity=100.0, latitude=30.9, longitude=75.8, availability_status="EXHAUSTED")
    score, distance, reasons = MatchingEngine.calculate_match_score(need, resource)
    assert score == 0.0

def test_accept_match_quantity_deduction_and_partial_matching(db_session):
    need = Need(requester_id=1, type="FOOD", title="Test Partial Need", quantity_required=100.0, unit="packets", location="Ludhiana", latitude=30.9, longitude=75.8, priority="HIGH", status="OPEN")
    resource = Resource(owner_id=1, type="FOOD", title="Test Small Food Resource", quantity=40.0, unit="packets", location="Ludhiana", latitude=30.9, longitude=75.8, availability_status="AVAILABLE")
    db_session.add(need)
    db_session.add(resource)
    db_session.commit()

    match = Match(need_id=need.id, resource_id=resource.id, match_score=95.0, distance=1.0, status="PROPOSED", reason="[]")
    db_session.add(match)
    db_session.commit()

    # Process match acceptance
    updated_match = MatchingEngine.process_match_acceptance(db_session, match.id)
    assert updated_match.status == "ACCEPTED"
    assert need.quantity_required == 60.0  # 100 - 40
    assert need.status == "PARTIALLY_MATCHED"
    assert resource.quantity == 0.0
    assert resource.availability_status == "EXHAUSTED"
