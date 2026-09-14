import json
import logging
from datetime import datetime, timedelta
import random

import sys
from pathlib import Path

# Add current directory and parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    from db import get_db_connection, init_db
except ImportError:
    try:
        from database.db import get_db_connection, init_db
    except ImportError:
        from backend.database.db import get_db_connection, init_db

logger = logging.getLogger("ripepulse.seed")

SEED_BATCHES = [
    {
        "id": "BAT-9042",
        "produce": "Organic Strawberries",
        "variety": "Mahabaleshwar Premium",
        "icon": "🍓",
        "harvestDate": "2026-09-10",
        "arrivalDate": "2026-09-11 08:30",
        "zone": "Deep Chill Bay A",
        "palletCount": 14,
        "weightKg": 2800,
        "estimatedValue": 14200,
        "currentTemp": 7.2,
        "baselineTemp": 2.0,
        "currentHumidity": 94,
        "currentVoc": 6.8,
        "baselineVoc": 0.5,
        "sli": 26,
        "remainingShelfLifeHours": 16,
        "initialShelfLifeHours": 144,
        "riskLevel": "CRITICAL",
        "confidenceScore": 95.8,
        "decayRateFactor": 3.4,
        "currentRoute": {
            "destinationName": "Delhi NCR MegaGrocers DC",
            "destinationType": "Regional Supermarket Hub",
            "distanceKm": 810,
            "transitDurationHours": 18,
            "isFeasible": False,
            "scheduledDeparture": "2026-09-13 16:00",
            "routeCoordinates": [
                [22.6280, 75.6820],
                [23.2599, 77.4126],
                [25.4484, 78.5685],
                [27.1767, 78.0081],
                [28.6139, 77.2090]
            ]
        },
        "recommendedAction": {
            "actionType": "REROUTE_TO_PROCESSOR",
            "urgency": "IMMEDIATE",
            "title": "Reroute to Sanwer Road Food Processing & Juice Hub",
            "reason": "Severe temperature spike (+5.2°C) and elevated VOC (6.8 ppm) accelerated mold spore germination. Batch will spoil before reaching Delhi (18h transit vs 16h shelf-life). Immediate cold pressing preserves 91% economic value.",
            "targetDestinationId": "DEST-PROC-01",
            "economicRecoveryEst": "₹1,085,000 (91%)",
            "wasteAvoidedKg": 2800,
            "status": "PENDING_APPROVAL"
        }
    },
    {
        "id": "BAT-8920",
        "produce": "Roma Tomatoes",
        "variety": "Desi Hybrid Premium",
        "icon": "🍅",
        "harvestDate": "2026-09-08",
        "arrivalDate": "2026-09-09 11:15",
        "zone": "Controlled Atmosphere B",
        "palletCount": 22,
        "weightKg": 5500,
        "estimatedValue": 11000,
        "currentTemp": 13.8,
        "baselineTemp": 12.0,
        "currentHumidity": 88,
        "currentVoc": 4.9,
        "baselineVoc": 1.0,
        "sli": 48,
        "remainingShelfLifeHours": 42,
        "initialShelfLifeHours": 192,
        "riskLevel": "HIGH",
        "confidenceScore": 92.4,
        "decayRateFactor": 2.1,
        "currentRoute": {
            "destinationName": "Mumbai Central FreshMart Hub",
            "destinationType": "Supermarket Chain",
            "distanceKm": 580,
            "transitDurationHours": 12,
            "isFeasible": False,
            "scheduledDeparture": "2026-09-14 06:00",
            "routeCoordinates": [
                [22.6280, 75.6820],
                [21.1458, 72.7411],
                [19.0760, 72.8777]
            ]
        },
        "recommendedAction": {
            "actionType": "FLASH_DISCOUNT_LOCAL",
            "urgency": "HIGH",
            "title": "Flash Reroute: Vijay Nagar Retail Wholesale Hub",
            "reason": "Ethylene concentration rising rapidly in Zone B. 12h transit to Mumbai leaves minimal quality margin. Local Indore redistribution allows same-day retail sale at 20% promotional discount.",
            "targetDestinationId": "DEST-MART-01",
            "economicRecoveryEst": "₹725,000 (80%)",
            "wasteAvoidedKg": 5500,
            "status": "APPROVED"
        }
    },
    {
        "id": "BAT-8833",
        "produce": "Hass Avocados",
        "variety": "Grade 1 Export",
        "icon": "🥑",
        "harvestDate": "2026-09-06",
        "arrivalDate": "2026-09-07 14:00",
        "zone": "Controlled Atmosphere B",
        "palletCount": 18,
        "weightKg": 4200,
        "estimatedValue": 16800,
        "currentTemp": 11.8,
        "baselineTemp": 12.0,
        "currentHumidity": 85,
        "currentVoc": 2.1,
        "baselineVoc": 1.2,
        "sli": 74,
        "remainingShelfLifeHours": 110,
        "initialShelfLifeHours": 240,
        "riskLevel": "LOW",
        "confidenceScore": 97.1,
        "decayRateFactor": 1.05,
        "currentRoute": {
            "destinationName": "Bhopal Prime Wholesale Market",
            "destinationType": "Premium Supermarket",
            "distanceKm": 195,
            "transitDurationHours": 4.5,
            "isFeasible": True,
            "scheduledDeparture": "2026-09-13 22:00",
            "routeCoordinates": [
                [22.6280, 75.6820],
                [22.9676, 76.0534],
                [23.2599, 77.4126]
            ]
        },
        "recommendedAction": {
            "actionType": "PROCEED_AS_PLANNED",
            "urgency": "NORMAL",
            "title": "Maintain Scheduled Delivery to Bhopal",
            "reason": "Controlled atmosphere parameters stable. Firmness index normal. 110 hours RSL easily accommodates 4.5h transit with ample safety window.",
            "targetDestinationId": "DEST-BHOPAL-01",
            "economicRecoveryEst": "₹1,400,000 (100%)",
            "wasteAvoidedKg": 4200,
            "status": "PENDING_APPROVAL"
        }
    },
    {
        "id": "BAT-9104",
        "produce": "Baby Spinach & Arugula",
        "variety": "Organic Hydroponic",
        "icon": "🥬",
        "harvestDate": "2026-09-12",
        "arrivalDate": "2026-09-12 16:45",
        "zone": "Deep Chill Bay A",
        "palletCount": 8,
        "weightKg": 1200,
        "estimatedValue": 6000,
        "currentTemp": 3.1,
        "baselineTemp": 2.0,
        "currentHumidity": 96,
        "currentVoc": 1.1,
        "baselineVoc": 0.3,
        "sli": 62,
        "remainingShelfLifeHours": 38,
        "initialShelfLifeHours": 96,
        "riskLevel": "MEDIUM",
        "confidenceScore": 93.9,
        "decayRateFactor": 1.45,
        "currentRoute": {
            "destinationName": "Palasia Fresh Collection Center",
            "destinationType": "Local Cooperative",
            "distanceKm": 18,
            "transitDurationHours": 0.5,
            "isFeasible": True,
            "scheduledDeparture": "2026-09-14 04:00",
            "routeCoordinates": [
                [22.6280, 75.6820],
                [22.7244, 75.8839]
            ]
        },
        "recommendedAction": {
            "actionType": "PRIORITY_DISPATCH",
            "urgency": "MODERATE",
            "title": "Expedite Morning Dispatch",
            "reason": "Leaf respiration rate moderate. Route is feasible (0.5h transit vs 38h RSL). Recommend moving dispatch slot forward to ensure maximum freshness.",
            "targetDestinationId": "LOC-PAL-01",
            "economicRecoveryEst": "₹500,000 (100%)",
            "wasteAvoidedKg": 1200,
            "status": "APPROVED"
        }
    },
    {
        "id": "BAT-8711",
        "produce": "Honeycrisp Apples",
        "variety": "Kinnaur Grade A",
        "icon": "🍎",
        "harvestDate": "2026-09-02",
        "arrivalDate": "2026-09-04 09:00",
        "zone": "Dry Ambient Bay C",
        "palletCount": 30,
        "weightKg": 7500,
        "estimatedValue": 18750,
        "currentTemp": 4.9,
        "baselineTemp": 4.0,
        "currentHumidity": 84,
        "currentVoc": 0.9,
        "baselineVoc": 0.6,
        "sli": 88,
        "remainingShelfLifeHours": 340,
        "initialShelfLifeHours": 720,
        "riskLevel": "LOW",
        "confidenceScore": 98.4,
        "decayRateFactor": 1.02,
        "currentRoute": {
            "destinationName": "Delhi NCR MegaGrocers DC",
            "destinationType": "National Grocery Network",
            "distanceKm": 810,
            "transitDurationHours": 18,
            "isFeasible": True,
            "scheduledDeparture": "2026-09-15 10:00",
            "routeCoordinates": [
                [22.6280, 75.6820],
                [27.1767, 78.0081],
                [28.6139, 77.2090]
            ]
        },
        "recommendedAction": {
            "actionType": "PROCEED_AS_PLANNED",
            "urgency": "LOW",
            "title": "Standard Inventory Hold",
            "reason": "Respiration index minimal. Batch is exceptionally robust with over 14 days remaining buffer.",
            "targetDestinationId": "DEST-DELHI-DC",
            "economicRecoveryEst": "₹1,550,000 (100%)",
            "wasteAvoidedKg": 7500,
            "status": "PENDING_APPROVAL"
        }
    }
]

SEED_DESTINATIONS = [
    {
        "id": "DEST-PROC-01",
        "name": "Sanwer Road Food Processing & Juice Hub",
        "type": "Food Processor / Juicer",
        "icon": "🏭",
        "category": "PROCESSOR",
        "location": "Sanwer Road Industrial Area, Indore, MP",
        "distanceKm": 18,
        "travelTimeMinutes": 28,
        "coordinates": [22.7750, 75.8360],
        "capacityAvailableKg": 8500,
        "preferredProduce": ["Strawberries", "Apples", "Berries", "Tomatoes"],
        "pricingFactor": 0.91,
        "contactPerson": "Rajesh Sharma (Intake Mgr)",
        "phone": "+91 98260 12345",
        "rating": 4.9,
        "recommendedForBatches": ["BAT-9042"]
    },
    {
        "id": "DEST-MART-01",
        "name": "Vijay Nagar Retail Wholesale Hub",
        "type": "Discount Supermarket Hub",
        "icon": "🏪",
        "category": "SUPERMARKET",
        "location": "Vijay Nagar AB Road, Indore, MP",
        "distanceKm": 12,
        "travelTimeMinutes": 20,
        "coordinates": [22.7533, 75.8937],
        "capacityAvailableKg": 12000,
        "preferredProduce": ["Roma Tomatoes", "Avocados", "Citrus", "Melons"],
        "pricingFactor": 0.80,
        "contactPerson": "Vikram Malhotra (Procurement)",
        "phone": "+91 98930 67890",
        "rating": 4.7,
        "recommendedForBatches": ["BAT-8920"]
    },
    {
        "id": "DEST-RELIEF-01",
        "name": "Dewas Naka Food Relief & Charity Bank",
        "type": "Non-Profit Food Bank",
        "icon": "🤝",
        "category": "FOOD_BANK",
        "location": "Dewas Naka Niranjanpur, Indore, MP",
        "distanceKm": 15,
        "travelTimeMinutes": 22,
        "coordinates": [22.7690, 75.8980],
        "capacityAvailableKg": 15000,
        "preferredProduce": ["All Fresh Produce", "Strawberries", "Greens", "Apples"],
        "pricingFactor": 0.0,
        "contactPerson": "Sunita Patel (Donation Director)",
        "phone": "+91 94250 54321",
        "rating": 5.0,
        "recommendedForBatches": ["BAT-9042", "BAT-8920"]
    },
    {
        "id": "DEST-KITCHEN-01",
        "name": "Rau Commercial Ready-Meals Kitchen",
        "type": "Prepared Food & Catering",
        "icon": "🍲",
        "category": "COMMERCIAL_KITCHEN",
        "location": "Rau Bypass Circle, Indore, MP",
        "distanceKm": 22,
        "travelTimeMinutes": 30,
        "coordinates": [22.6350, 75.8080],
        "capacityAvailableKg": 4000,
        "preferredProduce": ["Tomatoes", "Leafy Greens", "Avocados", "Peppers"],
        "pricingFactor": 0.85,
        "contactPerson": "Chef Amit Verma",
        "phone": "+91 97520 98765",
        "rating": 4.8,
        "recommendedForBatches": ["BAT-8920"]
    }
]

SEED_ALERTS = [
    {
        "id": "ALT-1092",
        "batchId": "BAT-9042",
        "produce": "Organic Strawberries",
        "severity": "CRITICAL",
        "title": "Cold-Chain Thermal Abuse & Ethylene Surge",
        "message": "Zone A Sensor #09 reported 7.2°C (+5.2°C above max specification). Ethylene accumulated to 6.8 ppm. Predicted remaining shelf life collapsed to 16h.",
        "timestamp": "12 mins ago",
        "status": "UNRESOLVED",
        "actionRequired": "Approve emergency reroute to Sanwer Road Processing Hub before 16:00 dispatch cutoff"
    },
    {
        "id": "ALT-1088",
        "batchId": "BAT-8920",
        "produce": "Roma Tomatoes",
        "severity": "HIGH",
        "title": "Transit Infeasibility Warning",
        "message": "Current route to Mumbai (12h transit) will arrive with SLI below 30% retail freshness requirement.",
        "timestamp": "48 mins ago",
        "status": "UNRESOLVED",
        "actionRequired": "Reroute to regional wholesale buyer Vijay Nagar Retail Hub"
    },
    {
        "id": "ALT-1076",
        "batchId": "BAT-9104",
        "produce": "Baby Spinach",
        "severity": "MEDIUM",
        "title": "Microclimate Respiration Escalation",
        "message": "Relative humidity fluctuation detected in Pallet Bay 04. Slight acceleration in chlorophyll degradation rate.",
        "timestamp": "2 hours ago",
        "status": "ACKNOWLEDGED",
        "actionRequired": "Expedite morning loading schedule"
    },
    {
        "id": "ALT-1050",
        "batchId": "BAT-8833",
        "produce": "Hass Avocados",
        "severity": "LOW",
        "title": "Routine Sensor Calibration Complete",
        "message": "Chamber B VOC spectrometer self-check successful. Accuracy verified at 99.4%.",
        "timestamp": "5 hours ago",
        "status": "RESOLVED",
        "actionRequired": "None"
    }
]

SEED_DISPATCHES = [
    {
        "id": "DISP-5521",
        "batchId": "BAT-8920",
        "produce": "Roma Tomatoes",
        "destination": "Vijay Nagar Retail Wholesale Hub",
        "status": "IN_TRANSIT",
        "carrier": "Indore GreenExpress Cold Logistics #402",
        "driverName": "Suresh Kumar",
        "driverPhone": "+91 98930 11223",
        "departureTime": "13:30 Today",
        "eta": "14:15 Today (22 mins left)",
        "progressPct": 65,
        "currentCoordinates": [22.7300, 75.8700],
        "temperatureMaintained": "11.9°C (Compliant)",
        "wasteAvoidedKg": 5500,
        "recoveredValue": "₹725,000"
    },
    {
        "id": "DISP-5490",
        "batchId": "BAT-8610",
        "produce": "Nagpur Oranges",
        "destination": "Sanwer Road Food Processing & Juice Hub",
        "status": "DELIVERED",
        "carrier": "Malwa Cold Freight Fleet #11",
        "driverName": "Ramesh Chand",
        "driverPhone": "+91 94250 88776",
        "departureTime": "09:00 Today",
        "eta": "Delivered at 10:15 Today",
        "progressPct": 100,
        "currentCoordinates": [22.7750, 75.8360],
        "temperatureMaintained": "5.1°C (Compliant)",
        "wasteAvoidedKg": 9200,
        "recoveredValue": "₹950,000"
    }
]

def generate_telemetry_history(batch_id: str, count: int = 25):
    readings = []
    now = datetime.now()
    is_spiked = (batch_id == "BAT-9042")
    is_tomato = (batch_id == "BAT-8920")

    for i in range(count - 1, -1, -1):
        ts = now - timedelta(hours=i)
        time_label = ts.strftime("%H:%M")
        
        temp = 2.1
        humidity = 92.0
        voc = 0.4
        sli = max(10.0, 98.0 - (count - 1 - i) * 1.5)

        if is_spiked:
            if i <= 14:
                temp = round(2.1 + (14 - i) * 0.4 + random.uniform(0.0, 0.3), 1)
                voc = round(0.4 + (14 - i) * 0.45 + random.uniform(0.0, 0.2), 1)
                sli = round(max(18.0, 92.0 - (14 - i) * 5.2 - random.uniform(0.0, 2.0)), 1)
            else:
                temp = round(2.0 + random.uniform(0.0, 0.4), 1)
                voc = round(0.4 + random.uniform(0.0, 0.1), 1)
        elif is_tomato:
            if i <= 10:
                temp = round(12.2 + (10 - i) * 0.18, 1)
                voc = round(1.2 + (10 - i) * 0.35, 1)
                sli = round(max(45.0, 85.0 - (count - 1 - i) * 1.6), 1)
            else:
                temp = round(12.0 + random.uniform(0.0, 0.3), 1)
                voc = round(1.0 + random.uniform(0.0, 0.2), 1)

        readings.append({
            "batch_id": batch_id,
            "timestamp": ts.isoformat(),
            "time_label": time_label,
            "temperature": temp,
            "optimal_temp": 12.0 if is_tomato else 2.0,
            "max_threshold": 14.5 if is_tomato else 4.0,
            "humidity": humidity,
            "optimal_humidity": 90.0,
            "voc": voc,
            "voc_threshold": 2.0,
            "sli": sli,
            "decay_acceleration": round((temp / 2.0) * 1.4 if temp > 3.0 else 1.0, 2)
        })
    return readings

def seed_database(force: bool = False):
    """Seeds the SQLite database with Indore MP operational data if empty or forced."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM batches;")
    batch_count = cursor.fetchone()[0]

    if batch_count == 0 or force:
        logger.info("Seeding database with initial Indore MP produce batches, destinations, alerts, and dispatches...")

        # Clear existing data if force
        if force:
            cursor.execute("DELETE FROM telemetry_readings;")
            cursor.execute("DELETE FROM alerts;")
            cursor.execute("DELETE FROM dispatches;")
            cursor.execute("DELETE FROM destinations;")
            cursor.execute("DELETE FROM batches;")

        # 1. Batches
        for b in SEED_BATCHES:
            cursor.execute("""
            INSERT INTO batches (
                id, produce, variety, icon, harvest_date, arrival_date, zone,
                pallet_count, weight_kg, estimated_value, current_temp, baseline_temp,
                current_humidity, current_voc, baseline_voc, sli, remaining_shelf_life_hours,
                initial_shelf_life_hours, risk_level, confidence_score, decay_rate_factor,
                current_route, recommended_action
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                b["id"], b["produce"], b["variety"], b["icon"], b["harvestDate"], b["arrivalDate"],
                b["zone"], b["palletCount"], b["weightKg"], b["estimatedValue"], b["currentTemp"],
                b["baselineTemp"], b["currentHumidity"], b["currentVoc"], b["baselineVoc"], b["sli"],
                b["remainingShelfLifeHours"], b["initialShelfLifeHours"], b["riskLevel"],
                b["confidenceScore"], b["decayRateFactor"],
                json.dumps(b["currentRoute"]),
                json.dumps(b["recommendedAction"])
            ))

            # Telemetry history for each batch
            readings = generate_telemetry_history(b["id"])
            for r in readings:
                cursor.execute("""
                INSERT INTO telemetry_readings (
                    batch_id, timestamp, time_label, temperature, optimal_temp, max_threshold,
                    humidity, optimal_humidity, voc, voc_threshold, sli, decay_acceleration
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    r["batch_id"], r["timestamp"], r["time_label"], r["temperature"], r["optimal_temp"],
                    r["max_threshold"], r["humidity"], r["optimal_humidity"], r["voc"],
                    r["voc_threshold"], r["sli"], r["decay_acceleration"]
                ))

        # 2. Destinations
        for d in SEED_DESTINATIONS:
            cursor.execute("""
            INSERT INTO destinations (
                id, name, type, icon, category, location, distance_km, travel_time_minutes,
                coordinates, capacity_available_kg, preferred_produce, pricing_factor,
                contact_person, phone, rating, recommended_for_batches
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                d["id"], d["name"], d["type"], d["icon"], d["category"], d["location"],
                d["distanceKm"], d["travelTimeMinutes"], json.dumps(d["coordinates"]),
                d["capacityAvailableKg"], json.dumps(d["preferredProduce"]), d["pricingFactor"],
                d["contactPerson"], d["phone"], d["rating"],
                json.dumps(d["recommendedForBatches"])
            ))

        # 3. Alerts
        for a in SEED_ALERTS:
            cursor.execute("""
            INSERT INTO alerts (
                id, batch_id, produce, severity, title, message, timestamp, status, action_required
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                a["id"], a["batchId"], a["produce"], a["severity"], a["title"],
                a["message"], a["timestamp"], a["status"], a["actionRequired"]
            ))

        # 4. Dispatches
        for dp in SEED_DISPATCHES:
            cursor.execute("""
            INSERT INTO dispatches (
                id, batch_id, produce, destination, status, carrier, driver_name, driver_phone,
                departure_time, eta, progress_pct, current_coordinates, temperature_maintained,
                waste_avoided_kg, recovered_value
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                dp["id"], dp["batchId"], dp["produce"], dp["destination"], dp["status"],
                dp["carrier"], dp["driverName"], dp["driverPhone"], dp["departureTime"],
                dp["eta"], dp["progressPct"], json.dumps(dp["currentCoordinates"]),
                dp["temperatureMaintained"], dp["wasteAvoidedKg"], dp["recoveredValue"]
            ))
        logger.info(f"Seeded {len(SEED_BATCHES)} produce batches and operational records.")
    else:
        logger.info(f"Batches already populated ({batch_count} exist). Preserving existing inventory.")

    # 5. Audit Logs (independent idempotent check)
    cursor.execute("SELECT COUNT(*) FROM audit_logs;")
    audit_count = cursor.fetchone()[0]

    if audit_count == 0 or force:
        if force:
            cursor.execute("DELETE FROM audit_logs;")
        SEED_AUDIT_LOGS = [
            {
                "id": "AUD-901041",
                "actor_name": "Elena Vance",
                "actor_role": "WAREHOUSE_MANAGER",
                "action": "BATCH_CREATE",
                "entity_type": "BATCH",
                "entity_id": "BAT-9042",
                "description": "Registered batch BAT-9042 (Organic Strawberries, 2800 kg) into Deep Chill Bay A.",
                "previous_status": None,
                "new_status": "CRITICAL",
                "details": json.dumps({"weight_kg": 2800, "produce": "Organic Strawberries"}),
                "facility": "Indore Central Cold-Storage Hub",
                "timestamp": "2026-09-14 08:30:00"
            },
            {
                "id": "AUD-901042",
                "actor_name": "Marcus Chen",
                "actor_role": "SUPPLY_CHAIN_MANAGER",
                "action": "REROUTE_DISPATCH",
                "entity_type": "DISPATCH",
                "entity_id": "DISP-5521",
                "description": "Executed emergency reroute for BAT-8920 to Vijay Nagar Retail Wholesale Hub.",
                "previous_status": "INFEASIBLE_ROUTE",
                "new_status": "IN_TRANSIT",
                "details": json.dumps({"destination": "Vijay Nagar Retail Wholesale Hub", "waste_avoided_kg": 5500}),
                "facility": "Indore Regional Logistics Operations",
                "timestamp": "2026-09-14 09:15:00"
            },
            {
                "id": "AUD-901043",
                "actor_name": "Rajesh Sharma",
                "actor_role": "DESTINATION_RECEIVER",
                "action": "SHIPMENT_ACCEPTED",
                "entity_type": "RECEIPT",
                "entity_id": "RCPT-5490",
                "description": "Verified intake receipt for DISP-5490 (Nagpur Oranges): 9200 kg received in good condition.",
                "previous_status": "IN_TRANSIT",
                "new_status": "ACCEPTED",
                "details": json.dumps({"received_weight_kg": 9200, "damaged_weight_kg": 0, "condition": "Good"}),
                "facility": "Sanwer Road Food Processing & Juice Hub",
                "timestamp": "2026-09-14 10:15:00"
            },
            {
                "id": "AUD-901044",
                "actor_name": "Dr. Maya Lin",
                "actor_role": "ADMIN",
                "action": "SYSTEM_DIAGNOSTICS",
                "entity_type": "AI_MODEL",
                "entity_id": "ripepulse_model.pkl",
                "description": "Verified XGBoost CPU pipeline inference health and Arrhenius kinetics calibration.",
                "previous_status": "PENDING_VERIFICATION",
                "new_status": "ONLINE_VERIFIED",
                "details": json.dumps({"status": "HEALTHY", "features": 7}),
                "facility": "RipePulse Command Center",
                "timestamp": "2026-09-14 11:00:00"
            }
        ]

        for log in SEED_AUDIT_LOGS:
            cursor.execute("""
            INSERT OR IGNORE INTO audit_logs (
                id, actor_name, actor_role, action, entity_type, entity_id,
                description, previous_status, new_status, details, facility, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                log["id"], log["actor_name"], log["actor_role"], log["action"],
                log["entity_type"], log["entity_id"], log["description"],
                log["previous_status"], log["new_status"], log["details"],
                log["facility"], log["timestamp"]
            ))
        logger.info(f"Seeded {len(SEED_AUDIT_LOGS)} initial audit log entries into SQLite.")
    else:
        logger.info(f"Audit logs already populated ({audit_count} exist). Preserving existing audit trail.")

    # 6. Inquiries (independent idempotent check)
    cursor.execute("SELECT COUNT(*) FROM inquiries;")
    inq_count = cursor.fetchone()[0]

    if inq_count == 0 or force:
        if force:
            cursor.execute("DELETE FROM inquiries;")
        SEED_INQUIRIES = [
            {
                "id": "INQ-1001",
                "name": "Indore Central Cold Logistics",
                "email": "ops@indorecold.in",
                "organization": "Indore Central Cold Logistics",
                "message": "4,200 tons monthly capacity, 6 dual-temperature ripening vaults",
                "warehouse_name": "Indore Central Cold Logistics",
                "volume_details": "4,200 tons monthly capacity, 6 dual-temperature ripening vaults",
                "status": "REVIEWED",
                "created_at": "2026-09-12 14:20:00",
                "updated_at": "2026-09-12 14:20:00"
            },
            {
                "id": "INQ-1002",
                "name": "Malwa Fresh Agricultural Hub",
                "email": "director@malwafresh.org",
                "organization": "Malwa Fresh Agricultural Hub",
                "message": "Specialty berries and leafy greens, 8 CA chambers with ethylene monitoring",
                "warehouse_name": "Malwa Fresh Agricultural Hub",
                "volume_details": "Specialty berries and leafy greens, 8 CA chambers with ethylene monitoring",
                "status": "NEW",
                "created_at": "2026-09-13 09:45:00",
                "updated_at": "2026-09-13 09:45:00"
            }
        ]

        for inq in SEED_INQUIRIES:
            cursor.execute("""
            INSERT OR IGNORE INTO inquiries (
                id, name, email, organization, message, warehouse_name, volume_details, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                inq["id"], inq["name"], inq["email"], inq["organization"], inq["message"],
                inq["warehouse_name"], inq["volume_details"], inq["status"], inq["created_at"], inq["updated_at"]
            ))
        logger.info(f"Seeded {len(SEED_INQUIRIES)} initial assessment inquiries into SQLite.")
    else:
        logger.info(f"Inquiries already populated ({inq_count} exist). Preserving existing inquiries.")

    # 7. Destination Receipts & Destination Inventory (idempotent check)
    cursor.execute("SELECT COUNT(*) FROM destination_receipts;")
    receipt_count = cursor.fetchone()[0]

    if receipt_count == 0 or force:
        if force:
            cursor.execute("DELETE FROM destination_inventory;")
            cursor.execute("DELETE FROM destination_receipts;")

        # Seed initial receipt for already-delivered dispatch DISP-5490
        cursor.execute("""
        INSERT OR IGNORE INTO destination_receipts (
            id, dispatch_id, batch_id, sent_weight_kg, received_weight_kg, damaged_weight_kg,
            missing_weight_kg, product_condition, verification_notes, verified_by,
            facility_name, status, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            "RCPT-5490", "DISP-5490", "BAT-8610", 9200.0, 9200.0, 0.0,
            0.0, "Good", "All pallets verified cold and fully compliant upon arrival.", "Rajesh Sharma",
            "Sanwer Road Food Processing & Juice Hub", "ACCEPTED", "2026-09-14 10:15:00"
        ))

        cursor.execute("""
        INSERT OR IGNORE INTO destination_inventory (
            id, facility_name, produce, variety, batch_id, dispatch_id,
            received_weight_kg, product_condition, received_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            "INV-5490", "Sanwer Road Food Processing & Juice Hub", "Nagpur Oranges", "Nagpur Seedless",
            "BAT-8610", "DISP-5490", 9200.0, "Good", "2026-09-14 10:15:00"
        ))
        logger.info("Seeded initial destination receipt and on-hand inventory into SQLite.")
    else:
        logger.info(f"Destination receipts already populated ({receipt_count} exist). Preserving receipts.")

    conn.commit()
    conn.close()
    logger.info("Database initialization and idempotent seed check complete.")

if __name__ == "__main__":
    seed_database(force=False)
