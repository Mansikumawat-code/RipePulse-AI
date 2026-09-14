import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import random

try:
    from database.db import get_db_connection
    from model.model_loader import model_loader
    from services.risk_engine import (
        calculate_sli,
        derive_risk_level,
        calculate_explainability,
        calculate_prototype_confidence
    )
    from services.audit_service import audit_service, resolve_actor
except ImportError:
    from backend.database.db import get_db_connection
    from backend.model.model_loader import model_loader
    from backend.services.risk_engine import (
        calculate_sli,
        derive_risk_level,
        calculate_explainability,
        calculate_prototype_confidence
    )
    from backend.services.audit_service import audit_service, resolve_actor

logger = logging.getLogger("ripepulse.batch_service")

def row_to_batch_dict(row) -> Dict[str, Any]:
    """Converts a SQLite Row into a frontend-compatible camelCase batch object."""
    current_route = json.loads(row["current_route"]) if row["current_route"] else {}
    recommended_action = json.loads(row["recommended_action"]) if row["recommended_action"] else {}

    return {
        "id": row["id"],
        "produce": row["produce"],
        "variety": row["variety"],
        "icon": row["icon"],
        "harvestDate": row["harvest_date"],
        "arrivalDate": row["arrival_date"],
        "zone": row["zone"],
        "palletCount": row["pallet_count"],
        "weightKg": row["weight_kg"],
        "estimatedValue": row["estimated_value"],
        "currentTemp": row["current_temp"],
        "baselineTemp": row["baseline_temp"],
        "currentHumidity": row["current_humidity"],
        "currentVoc": row["current_voc"],
        "baselineVoc": row["baseline_voc"],
        "sli": row["sli"],
        "remainingShelfLifeHours": row["remaining_shelf_life_hours"],
        "initialShelfLifeHours": row["initial_shelf_life_hours"],
        "riskLevel": row["risk_level"],
        "confidenceScore": row["confidence_score"],
        "decayRateFactor": row["decay_rate_factor"],
        "isRerouted": bool(row["is_rerouted"] or 0),
        "rerouteRequired": bool(row["reroute_required"] or 0),
        "routeIssue": bool(row["route_issue"] or 0),
        "rerouteStatus": row["reroute_status"] or "pending",
        "currentRoute": current_route,
        "recommendedAction": recommended_action
    }

class BatchService:
    def get_all_batches(self) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM batches ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        return [row_to_batch_dict(r) for r in rows]

    def get_batch_by_id(self, batch_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM batches WHERE id = ?", (batch_id,))
        row = cursor.fetchone()
        conn.close()
        return row_to_batch_dict(row) if row else None

    def create_batch(self, batch_data: Dict[str, Any], actor_role: str = "WAREHOUSE_MANAGER", actor_name: Optional[str] = None) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()

        batch_id = batch_data.get("id") or f"BAT-{random.randint(1000, 9999)}"
        produce = batch_data.get("produce") or "Tomato"
        variety = batch_data.get("variety") or "Hybrid"

        # Produce-aware icons
        icons = {
            "tomato": "🍅", "strawberr": "🍓", "appl": "🍎", "banana": "🍌",
            "spinach": "🥬", "broccol": "🥦", "carrot": "🥕", "bell pepper": "🫑",
            "potato": "🥔", "orang": "🍊", "grape": "🍇", "mango": "🥭"
        }
        icon = batch_data.get("icon")
        if not icon:
            p_lower = produce.lower()
            icon = "📦"
            for k, ic in icons.items():
                if k in p_lower:
                    icon = ic
                    break

        arrival_date = batch_data.get("arrivalDate") or datetime.now().strftime("%Y-%m-%d %H:%M")
        harvest_date = batch_data.get("harvestDate") or datetime.now().strftime("%Y-%m-%d")
        zone = batch_data.get("zone") or ("Controlled Atmosphere B" if "tomato" in produce.lower() else "Deep Chill Bay A")
        pallet_count = int(batch_data.get("palletCount") or 10)
        weight_kg = float(batch_data.get("weightKg") or 850)
        estimated_value = float(batch_data.get("estimatedValue") or (weight_kg * 4.5))

        # Baseline temp
        try:
            from config import PRODUCE_OPTIMAL_BASELINES
        except ImportError:
            from backend.config import PRODUCE_OPTIMAL_BASELINES
        norm_produce = model_loader.normalize_produce(produce)
        opt_temp = PRODUCE_OPTIMAL_BASELINES.get(norm_produce, 15.0 if "tomato" in produce.lower() else 2.0)

        target_temp = float(batch_data.get("targetTemp") or opt_temp)
        current_temp = float(batch_data.get("currentTemp") or target_temp)
        baseline_temp = opt_temp
        current_humidity = float(batch_data.get("currentHumidity") or 88.0)
        current_voc = float(batch_data.get("currentVoc") or 0.8)
        baseline_voc = 0.8 if "tomato" in produce.lower() else 0.5

        # Storage age & initial shelf life
        storage_age_days = float(batch_data.get("storageAgeDays") or batch_data.get("storageAge") or 4.0 if "tomato" in produce.lower() else 1.0)
        initial_rsl_days = float(batch_data.get("initialShelfLifeDays") or batch_data.get("initialShelfLife") or 21.0 if "tomato" in produce.lower() else 7.0)
        initial_rsl_hours = float(batch_data.get("initialShelfLifeHours") or (initial_rsl_days * 24.0))

        # Run AI prediction on initial ingestion state
        try:
            rsl_days, age_ratio = model_loader.predict_shelf_life(
                produce_type=produce,
                temperature=current_temp,
                humidity=current_humidity,
                voc=current_voc,
                storage_age=storage_age_days,
                initial_shelf_life=initial_rsl_days
            )
            rsl_hours = round(rsl_days * 24.0, 1)
        except Exception as e:
            logger.warning(f"Initial AI prediction fallback: {e}")
            rsl_hours = initial_rsl_hours
            rsl_days = initial_rsl_days


        sli = calculate_sli(remaining_shelf_life=rsl_hours, initial_shelf_life=initial_rsl_hours)
        risk_level = derive_risk_level(sli=sli, remaining_hours=rsl_hours)
        explain_data = calculate_explainability(current_temp, current_voc, baseline_temp, baseline_voc)
        _, conf_score = calculate_prototype_confidence(sli=sli)

        # Default standard route
        default_destination = batch_data.get("defaultDestination") or "Delhi NCR MegaGrocers DC"
        current_route = {
            "destinationName": default_destination,
            "destinationType": "Supermarket DC",
            "distanceKm": 810,
            "transitDurationHours": 18,
            "isFeasible": (rsl_hours - 18) >= 8,
            "scheduledDeparture": "Tomorrow 08:00",
            "routeCoordinates": [[22.6280, 75.6820], [28.6139, 77.2090]]
        }

        # Recommended Action
        recommended_action = {
            "actionType": "PROCEED_AS_PLANNED" if current_route["isFeasible"] else "REROUTE_TO_PROCESSOR",
            "urgency": "LOW" if current_route["isFeasible"] else "HIGH",
            "title": "Standard Route Approved" if current_route["isFeasible"] else "Alternative Reroute Recommended",
            "reason": "Initial inspection optimal. Shelf-life buffer intact." if current_route["isFeasible"] else "Transit exceeds safe threshold. Local absorption recommended.",
            "targetDestinationId": None if current_route["isFeasible"] else "DEST-PROC-01",
            "economicRecoveryEst": f"${int(estimated_value):,} (100%)",
            "wasteAvoidedKg": weight_kg,
            "status": "PENDING_APPROVAL"
        }

        cursor.execute("""
        INSERT INTO batches (
            id, produce, variety, icon, harvest_date, arrival_date, zone,
            pallet_count, weight_kg, estimated_value, current_temp, baseline_temp,
            current_humidity, current_voc, baseline_voc, sli, remaining_shelf_life_hours,
            initial_shelf_life_hours, risk_level, confidence_score, decay_rate_factor,
            current_route, recommended_action
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            batch_id, produce, variety, icon, harvest_date, arrival_date, zone,
            pallet_count, weight_kg, estimated_value, current_temp, baseline_temp,
            current_humidity, current_voc, baseline_voc, sli, rsl_hours,
            initial_rsl_hours, risk_level, conf_score, explain_data["decay_rate_factor"],
            json.dumps(current_route), json.dumps(recommended_action)
        ))

        # Add initial telemetry reading
        now_iso = datetime.utcnow().isoformat() + "Z"
        now_time = datetime.utcnow().strftime("%H:%M")
        cursor.execute("""
        INSERT INTO telemetry_readings (
            batch_id, timestamp, time_label, temperature, optimal_temp, max_threshold,
            humidity, optimal_humidity, voc, voc_threshold, sli, decay_acceleration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            batch_id, now_iso, now_time, current_temp, baseline_temp, baseline_temp + 2.0,
            current_humidity, 90.0, current_voc, 2.0, sli, explain_data["decay_rate_factor"]
        ))
        cursor.execute(
            "UPDATE batches SET reroute_required = ?, route_issue = ? WHERE id = ?",
            (1 if not current_route["isFeasible"] else 0, 1 if not current_route["isFeasible"] else 0, batch_id)
        )

        conn.commit()
        conn.close()

        # Log system audit event
        try:
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="BATCH_CREATE",
                entity_type="BATCH",
                entity_id=batch_id,
                description=f"Registered produce batch {batch_id} ({produce}, {weight_kg} kg) in {zone}.",
                new_status=risk_level,
                details={"weight_kg": weight_kg, "produce": produce, "zone": zone, "initial_sli": sli},
                facility="Indore Central Cold-Storage Hub"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit event for batch create: {e}")

        return self.get_batch_by_id(batch_id)

    def update_batch_action_status(self, batch_id: str, status: str, actor_role: str = "WAREHOUSE_MANAGER", actor_name: Optional[str] = None) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT recommended_action FROM batches WHERE id = ?", (batch_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return {"success": False, "error": "Batch not found"}

        action = json.loads(row["recommended_action"]) if row["recommended_action"] else {}
        prev_status = action.get("status", "PENDING_APPROVAL")
        action["status"] = status

        cursor.execute("UPDATE batches SET recommended_action = ? WHERE id = ?", (json.dumps(action), batch_id))
        conn.commit()
        conn.close()

        # Log system audit event
        try:
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="BATCH_ACTION_UPDATE",
                entity_type="BATCH",
                entity_id=batch_id,
                description=f"Updated operational recommendation status for batch {batch_id} to '{status}'.",
                previous_status=prev_status,
                new_status=status,
                details={"batch_id": batch_id, "action_title": action.get("title")},
                facility="Indore Central Cold-Storage Hub"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit event for batch action update: {e}")

        return {"success": True, "batchId": batch_id, "status": status}

    def get_batch_telemetry(self, batch_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM telemetry_readings WHERE batch_id = ? ORDER BY id ASC
        """, (batch_id,))
        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "time": r["time_label"],
                "timestamp": r["timestamp"],
                "temperature": r["temperature"],
                "optimalTemp": r["optimal_temp"],
                "maxThreshold": r["max_threshold"],
                "humidity": r["humidity"],
                "optimalHumidity": r["optimal_humidity"],
                "voc": r["voc"],
                "vocThreshold": r["voc_threshold"],
                "sli": r["sli"],
                "decayAcceleration": r["decay_acceleration"]
            }
            for r in rows
        ]

    def update_batch(self, batch_id: str, update_data: Dict[str, Any], actor_role: str = "WAREHOUSE_MANAGER", actor_name: Optional[str] = None) -> Dict[str, Any]:
        """Updates batch parameters and logs audit event."""
        batch = self.get_batch_by_id(batch_id)
        if not batch:
            raise ValueError(f"Batch {batch_id} not found")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Updatable fields
        pallet_count = update_data.get("palletCount", batch["palletCount"])
        weight_kg = update_data.get("weightKg", batch["weightKg"])
        zone = update_data.get("zone", batch["zone"])
        current_temp = update_data.get("currentTemp", batch["currentTemp"])
        current_humidity = update_data.get("currentHumidity", batch["currentHumidity"])
        current_voc = update_data.get("currentVoc", batch["currentVoc"])

        cursor.execute("""
        UPDATE batches SET pallet_count = ?, weight_kg = ?, zone = ?, current_temp = ?, current_humidity = ?, current_voc = ?
        WHERE id = ?
        """, (pallet_count, weight_kg, zone, current_temp, current_humidity, current_voc, batch_id))
        conn.commit()
        conn.close()

        # Audit log
        try:
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="BATCH_UPDATE",
                entity_type="BATCH",
                entity_id=batch_id,
                description=f"Updated batch {batch_id} properties (Zone: {zone}, Pallets: {pallet_count}).",
                details=update_data,
                facility="Indore Central Cold-Storage Hub"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit event for batch update: {e}")

        return self.get_batch_by_id(batch_id)

    def delete_batch(self, batch_id: str, actor_role: str = "WAREHOUSE_MANAGER", actor_name: Optional[str] = None) -> bool:
        """Deletes a batch and its associated telemetry with audit logging."""
        batch = self.get_batch_by_id(batch_id)
        if not batch:
            raise ValueError(f"Batch {batch_id} not found")

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM telemetry_readings WHERE batch_id = ?", (batch_id,))
        cursor.execute("DELETE FROM batches WHERE id = ?", (batch_id,))
        conn.commit()
        conn.close()

        # Audit log
        try:
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="BATCH_DELETE",
                entity_type="BATCH",
                entity_id=batch_id,
                description=f"Deleted produce batch {batch_id} ({batch.get('produce')}).",
                facility="Indore Central Cold-Storage Hub"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit event for batch delete: {e}")

        return True

    def get_warehouse_telemetry(self, warehouse_id: str = "WH-IND-01") -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT AVG(current_temp), AVG(current_humidity), AVG(current_voc), COUNT(*) FROM batches")
        avg_temp, avg_hum, avg_voc, count = cursor.fetchone()
        conn.close()

        return {
            "warehouseId": warehouse_id,
            "averageTemp": round(float(avg_temp or 4.8), 1),
            "averageHumidity": round(float(avg_hum or 88.0)),
            "averageVoc": round(float(avg_voc or 2.1), 1),
            "activeSensors": 48,
            "sensorsOnline": 48,
            "totalBatches": count or 5,
            "lastSync": datetime.now().strftime("%I:%M:%S %p")
        }

batch_service = BatchService()

