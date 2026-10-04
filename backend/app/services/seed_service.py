import json
from sqlalchemy.orm import Session
from app.models.domain import User, Resource, Need, Match, VolunteerAvailability, ActivityLog
from app.services.matching_engine import MatchingEngine
from app.services.activity_service import log_activity
from app.core.logging import logger

def seed_database(db: Session):
    """
    Seeds the database with realistic disaster response data across Punjab, Chandigarh & Delhi regions.
    """
    if db.query(User).count() > 0:
        logger.info("Database already seeded. Skipping initial seed.")
        return

    logger.info("Seeding comprehensive disaster response dataset for Stage 2...")

    # 1. Users (12 Entities)
    users_data = [
        User(id=1, name="Ludhiana Central Relief Hub", email="ludhiana.hub@reliefgrid.org", phone="+91-98765-01001", role="SHELTER", location="Ludhiana, Punjab"),
        User(id=2, name="Chandigarh Apex Medical Center", email="apex.hospital@reliefgrid.org", phone="+91-98765-01002", role="HOSPITAL", location="Chandigarh"),
        User(id=3, name="Amritsar Civil Hospital", email="civil.amritsar@reliefgrid.org", phone="+91-98765-01003", role="HOSPITAL", location="Amritsar, Punjab"),
        User(id=4, name="Punjab Disaster Relief Network", email="donor.network@reliefgrid.org", phone="+91-98765-01004", role="DONOR", location="Jalandhar, Punjab"),
        User(id=5, name="Red Cross Punjab Chapter", email="redcross.punjab@reliefgrid.org", phone="+91-98765-01005", role="DONOR", location="Patiala, Punjab"),
        User(id=6, name="Gurpreet Singh (Paramedic)", email="gurpreet.vol@reliefgrid.org", phone="+91-98765-01006", role="VOLUNTEER", location="Ludhiana, Punjab"),
        User(id=7, name="Anita Sharma (Rescue Specialist)", email="anita.vol@reliefgrid.org", phone="+91-98765-01007", role="VOLUNTEER", location="Chandigarh"),
        User(id=8, name="ReliefGrid Command Officer", email="command@reliefgrid.org", phone="+91-98765-01008", role="ADMIN", location="State Control Room, Mohali"),
        User(id=9, name="Patiala Community Shelter B", email="patiala.shelter@reliefgrid.org", phone="+91-98765-01009", role="SHELTER", location="Patiala, Punjab"),
        User(id=10, name="Delhi National Relief Depot", email="delhi.depot@reliefgrid.org", phone="+91-98765-01010", role="DONOR", location="Delhi NCR"),
        User(id=11, name="Bathinda Flood Relief Camp", email="bathinda.camp@reliefgrid.org", phone="+91-98765-01011", role="SHELTER", location="Bathinda, Punjab"),
        User(id=12, name="Rajesh Kumar (Heavy Driver)", email="rajesh.vol@reliefgrid.org", phone="+91-98765-01012", role="VOLUNTEER", location="Jalandhar, Punjab")
    ]
    db.add_all(users_data)
    db.commit()

    # 2. Resources (22 Entities)
    resources_data = [
        Resource(id=1, owner_id=4, type="FOOD", title="Ration & Prepared Food Packets", description="500 dry ration food packets containing rice, lentils, and energy bars.", quantity=500.0, unit="packets", location="Ludhiana Depot", latitude=30.9010, longitude=75.8573, availability_status="AVAILABLE", expiry_date="2026-12-31"),
        Resource(id=2, owner_id=5, type="WATER", title="Clean Drinking Water Containers", description="5000 liters of purified mineral water in sealed 20L containers.", quantity=5000.0, unit="liters", location="Patiala Supply Center", latitude=30.3398, longitude=76.3869, availability_status="AVAILABLE", expiry_date="2027-01-01"),
        Resource(id=3, owner_id=2, type="BLOOD", title="Universal O-Negative Blood Reserve", description="50 units of universal donor O-Negative blood packs.", quantity=50.0, unit="units", location="Chandigarh Blood Bank", latitude=30.7333, longitude=76.7794, availability_status="AVAILABLE", expiry_date="2026-11-15"),
        Resource(id=4, owner_id=4, type="MEDICINE", title="Emergency Trauma Kits & Antibiotics", description="150 comprehensive emergency trauma kits.", quantity=150.0, unit="boxes", location="Jalandhar Warehouse", latitude=31.3260, longitude=75.5762, availability_status="AVAILABLE", expiry_date="2027-06-30"),
        Resource(id=5, owner_id=1, type="SHELTER", title="Weatherproof Emergency Tents", description="80 high-capacity weatherproof shelter tents.", quantity=80.0, unit="tents", location="Ludhiana Sports Complex", latitude=30.8900, longitude=75.8400, availability_status="AVAILABLE"),
        Resource(id=6, owner_id=5, type="CLOTHING", title="Heavy Duty Rain Coats & Blankets", description="300 sets of waterproof outerwear and fleece blankets.", quantity=300.0, unit="sets", location="Patiala Disaster Depot", latitude=30.3400, longitude=76.3900, availability_status="AVAILABLE"),
        Resource(id=7, owner_id=6, type="VOLUNTEER", title="Certified First-Aid & Rescue Squad", description="Team of 15 certified volunteer first-responders.", quantity=15.0, unit="personnel", location="Ludhiana Central", latitude=30.9100, longitude=75.8600, availability_status="AVAILABLE"),
        Resource(id=8, owner_id=10, type="FOOD", title="Emergency MRE Meals Reserve", description="1000 ready-to-eat meal packets.", quantity=1000.0, unit="packets", location="Delhi Logistics Hub", latitude=28.6139, longitude=77.2090, availability_status="AVAILABLE"),
        Resource(id=9, owner_id=10, type="WATER", title="High Capacity Water Purification Unit", description="Mobile water filtration plant producing 10000L/day.", quantity=10000.0, unit="liters", location="Delhi Logistics Hub", latitude=28.6139, longitude=77.2090, availability_status="AVAILABLE"),
        Resource(id=10, owner_id=3, type="BLOOD", title="Amritsar Regional Blood Reserve", description="35 units of B-Positive & O-Negative blood.", quantity=35.0, unit="units", location="Amritsar Civil Blood Bank", latitude=31.6340, longitude=74.8723, availability_status="AVAILABLE"),
        Resource(id=11, owner_id=4, type="MEDICINE", title="Surgical Antiseptics & Bandages", description="200 boxes of sterile surgical supplies.", quantity=200.0, unit="boxes", location="Jalandhar Warehouse", latitude=31.3260, longitude=75.5762, availability_status="AVAILABLE"),
        Resource(id=12, owner_id=9, type="SHELTER", title="Patiala Community Shelter Space", description="Covered community hall with 120 folding cots.", quantity=120.0, unit="beds", location="Patiala Hall B", latitude=30.3350, longitude=76.3800, availability_status="AVAILABLE"),
        Resource(id=13, owner_id=11, type="CLOTHING", title="Warm Thermal Jackets", description="150 winter thermal jackets for flood victims.", quantity=150.0, unit="jackets", location="Bathinda Camp Depot", latitude=30.2110, longitude=74.9455, availability_status="AVAILABLE"),
        Resource(id=14, owner_id=4, type="OTHER", title="Diesel Generators 15kVA", description="5 portable diesel generators for emergency power.", quantity=5.0, unit="units", location="Jalandhar Warehouse", latitude=31.3260, longitude=75.5762, availability_status="AVAILABLE"),
        Resource(id=15, owner_id=10, type="OTHER", title="Medical Oxygen Cylinders 50L", description="40 high-pressure medical oxygen cylinders.", quantity=40.0, unit="cylinders", location="Delhi Logistics Hub", latitude=28.6139, longitude=77.2090, availability_status="AVAILABLE"),
        Resource(id=16, owner_id=1, type="FOOD", title="Ludhiana Community Kitchen Supply", description="Freshly cooked food packets.", quantity=250.0, unit="packets", location="Ludhiana Hub", latitude=30.9010, longitude=75.8573, availability_status="AVAILABLE"),
        Resource(id=17, owner_id=5, type="WATER", title="Patiala Municipal Water Tanker", description="12000 liters water tanker.", quantity=12000.0, unit="liters", location="Patiala Depot", latitude=30.3398, longitude=76.3869, availability_status="AVAILABLE"),
        Resource(id=18, owner_id=2, type="MEDICINE", title="Pediatric Antibiotics & Fluids", description="80 pediatric medical kits.", quantity=80.0, unit="kits", location="Chandigarh Apex", latitude=30.7333, longitude=76.7794, availability_status="AVAILABLE"),
        Resource(id=19, owner_id=3, type="VOLUNTEER", title="Amritsar Emergency Surgical Team", description="5 specialist trauma surgeons.", quantity=5.0, unit="personnel", location="Amritsar Trauma Center", latitude=31.6340, longitude=74.8723, availability_status="AVAILABLE"),
        Resource(id=20, owner_id=11, type="FOOD", title="Bathinda Grain Reserve", description="400 kg flour and rice.", quantity=400.0, unit="kg", location="Bathinda Camp", latitude=30.2110, longitude=74.9455, availability_status="AVAILABLE"),
        Resource(id=21, owner_id=4, type="BLOOD", title="Jalandhar Rotary Blood Bank", description="15 units AB-Positive blood.", quantity=15.0, unit="units", location="Jalandhar Rotary", latitude=31.3260, longitude=75.5762, availability_status="AVAILABLE"),
        Resource(id=22, owner_id=1, type="FOOD", title="Exhausted Emergency Ration Stock", description="Older ration stock now fully depleted.", quantity=0.0, unit="packets", location="Ludhiana Storage C", latitude=30.9010, longitude=75.8573, availability_status="EXHAUSTED")
    ]
    db.add_all(resources_data)
    db.commit()

    # 3. Needs (16 Entities)
    needs_data = [
        Need(id=1, requester_id=1, type="FOOD", title="Flood Relief Camp Food Shortage", description="Urgent food packets required for 200 displaced flood victims at Ludhiana Community Hall.", quantity_required=200.0, unit="packets", location="Ludhiana Community Hall", latitude=30.9050, longitude=75.8500, priority="CRITICAL", status="OPEN"),
        Need(id=2, requester_id=3, type="BLOOD", title="Mass Casualty Blood Reserve Need", description="Emergency requirement for 20 units of O-Negative blood following highway collision.", quantity_required=20.0, unit="units", location="Amritsar Apex Hospital Trauma Ward", latitude=31.6340, longitude=74.8723, priority="CRITICAL", status="OPEN"),
        Need(id=3, requester_id=1, type="WATER", title="Clean Water Shortage at Shelter B", description="Contaminated local water supply requires 1500 liters of purified drinking water.", quantity_required=1500.0, unit="liters", location="Ludhiana Shelter B", latitude=30.8980, longitude=75.8620, priority="HIGH", status="OPEN"),
        Need(id=4, requester_id=2, type="MEDICINE", title="Trauma Dressing Kits for Emergency Room", description="Require 40 boxes of emergency trauma bandage kits.", quantity_required=40.0, unit="boxes", location="Chandigarh Civil ER", latitude=30.7300, longitude=76.7800, priority="HIGH", status="OPEN"),
        Need(id=5, requester_id=1, type="SHELTER", title="Overnight Temporary Shelter Request", description="Need 30 tents to accommodate storm victims.", quantity_required=30.0, unit="tents", location="Jalandhar Relief Field", latitude=31.3200, longitude=75.5800, priority="MEDIUM", status="OPEN"),
        Need(id=6, requester_id=9, type="FOOD", title="Patiala Orphanage Meal Supplies", description="Require 100 ration packets for children in temporary shelter.", quantity_required=100.0, unit="packets", location="Patiala Relief Center", latitude=30.3398, longitude=76.3869, priority="HIGH", status="OPEN"),
        Need(id=7, requester_id=11, type="WATER", title="Bathinda Relief Camp Drinking Water", description="Need 2000 liters drinking water.", quantity_required=2000.0, unit="liters", location="Bathinda Relief Zone", latitude=30.2110, longitude=74.9455, priority="CRITICAL", status="OPEN"),
        Need(id=8, requester_id=3, type="MEDICINE", title="Amritsar Infection Control Antiseptics", description="50 boxes of antiseptic solution.", quantity_required=50.0, unit="boxes", location="Amritsar Civil ER", latitude=31.6340, longitude=74.8723, priority="MEDIUM", status="OPEN"),
        Need(id=9, requester_id=2, type="BLOOD", title="Emergency ICU Blood Transfusion Need", description="10 units O-Negative blood.", quantity_required=10.0, unit="units", location="Chandigarh Apex ICU", latitude=30.7333, longitude=76.7794, priority="CRITICAL", status="OPEN"),
        Need(id=10, requester_id=9, type="CLOTHING", title="Patiala Winter Blankets Need", description="200 fleece blankets for elderly evacuees.", quantity_required=200.0, unit="sets", location="Patiala Hall B", latitude=30.3350, longitude=76.3800, priority="HIGH", status="OPEN"),
        Need(id=11, requester_id=1, type="VOLUNTEER", title="Ludhiana Rescue Evacuation Support", description="10 volunteers with ambulance driving experience.", quantity_required=10.0, unit="personnel", location="Ludhiana Hub", latitude=30.9010, longitude=75.8573, priority="HIGH", status="OPEN"),
        Need(id=12, requester_id=11, type="OTHER", title="Bathinda Emergency Power Backup", description="2 15kVA diesel generators for field hospital.", quantity_required=2.0, unit="units", location="Bathinda Camp", latitude=30.2110, longitude=74.9455, priority="CRITICAL", status="OPEN"),
        Need(id=13, requester_id=2, type="OTHER", title="Chandigarh Oxygen Cylinder Refill", description="15 medical oxygen cylinders.", quantity_required=15.0, unit="cylinders", location="Chandigarh Apex", latitude=30.7333, longitude=76.7794, priority="CRITICAL", status="OPEN"),
        Need(id=14, requester_id=1, type="FOOD", title="Partial Meal Need (Scenario 5 Demo)", description="Demonstration need partially fulfilled: 50 packets remaining of 150 required.", quantity_required=50.0, unit="packets", location="Ludhiana Field Camp C", latitude=30.9010, longitude=75.8573, priority="MEDIUM", status="PARTIALLY_MATCHED"),
        Need(id=15, requester_id=3, type="FOOD", title="Amritsar Hospital Staff Meal Request", description="50 food packets.", quantity_required=50.0, unit="packets", location="Amritsar Hospital", latitude=31.6340, longitude=74.8723, priority="LOW", status="OPEN"),
        Need(id=16, requester_id=9, type="SHELTER", title="Patiala Emergency Cots Need", description="40 folding cots.", quantity_required=40.0, unit="beds", location="Patiala Center", latitude=30.3398, longitude=76.3869, priority="LOW", status="OPEN")
    ]
    db.add_all(needs_data)
    db.commit()

    # 4. Volunteer Availabilities (6 Entities)
    volunteers_data = [
        VolunteerAvailability(id=1, user_id=6, skills="First Aid, CPR, Ambulance Driving, Triage", availability_status="AVAILABLE", location="Ludhiana, Punjab", latitude=30.9010, longitude=75.8573),
        VolunteerAvailability(id=2, user_id=7, skills="Search & Rescue, Flood Evacuation, Structural Safety", availability_status="AVAILABLE", location="Chandigarh", latitude=30.7333, longitude=76.7794),
        VolunteerAvailability(id=3, user_id=12, skills="Heavy Vehicle Driving, Logistics Dispatch, Equipment Maintenance", availability_status="AVAILABLE", location="Jalandhar, Punjab", latitude=31.3260, longitude=75.5762)
    ]
    db.add_all(volunteers_data)
    db.commit()

    # 5. Pre-evaluated Matches & Activity Logs
    for need in needs_data[:10]:
        MatchingEngine.find_matches_for_need(db, need.id)

    log_activity(db, "RESOURCE_CREATED", "Initial Resource Grid Populated", "Seeded 22 emergency resources across Punjab & Delhi.", "RESOURCE", 1)
    log_activity(db, "NEED_CREATED", "Emergency Requirements Posted", "Seeded 16 active emergency requirements.", "NEED", 1)
    log_activity(db, "SYSTEM_INIT", "ReliefGrid Engine Initialized", "Database seeded and matching matrix initialized.", "SYSTEM", 0)

    logger.info("Database seeding complete!")
