import json
import logging
from typing import List, Dict, Any, Optional
import random
from datetime import datetime

try:
    from database.db import get_db_connection
    from services.batch_service import batch_service
    from services.routing_service import routing_service
    from services.audit_service import audit_service, resolve_actor
except ImportError:
    from backend.database.db import get_db_connection
    from backend.services.batch_service import batch_service
    from backend.services.routing_service import routing_service
    from backend.services.audit_service import audit_service, resolve_actor

logger = logging.getLogger("ripepulse.dispatch_service")

class DispatchService:
    def _format_dispatch(self, row) -> Dict[str, Any]:
        route_details = json.loads(row["route_details"]) if row["route_details"] else {}
        return {
            "id": row["id"], "batchId": row["batch_id"], "produce": row["produce"],
            "source": row["source"] or "Indore Central Cold-Storage Hub",
            "destination": row["destination"], "destinationId": row["destination_id"],
            "quantityKg": row["quantity_kg"] or row["waste_avoided_kg"], "vehicleId": row["vehicle_id"],
            "status": row["status"], "carrier": row["carrier"], "driverName": row["driver_name"],
            "driverPhone": row["driver_phone"], "departureTime": row["departure_time"], "eta": row["eta"],
            "progressPct": row["progress_pct"],
            "currentCoordinates": json.loads(row["current_coordinates"]) if row["current_coordinates"] else [22.7196, 75.8577],
            "temperatureMaintained": row["temperature_maintained"], "wasteAvoidedKg": row["waste_avoided_kg"],
            "recoveredValue": row["recovered_value"], "createdAt": row["created_at"],
            "dispatchedAt": row["dispatched_at"], "arrivedAt": row["arrived_at"],
            "route": route_details, "notes": row["notes"],
            "isRerouted": bool(row["is_rerouted"] or 0),
            "rerouteRequired": bool(row["reroute_required"] or 0),
            "routeIssue": bool(row["route_issue"] or 0),
            "rerouteStatus": row["reroute_status"] or "pending",
            "issueReason": row["issue_reason"]
        }

    def get_all_dispatches(self) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM dispatches ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()

        return [self._format_dispatch(r) for r in rows]

    def get_dispatch(self, dispatch_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM dispatches WHERE id = ?", (dispatch_id,)).fetchone()
        conn.close()
        return self._format_dispatch(row) if row else None

    def get_active_dispatches(self) -> List[Dict[str, Any]]:
        terminal = {"DELIVERED", "ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED", "CANCELLED"}
        return [d for d in self.get_all_dispatches() if d["status"] not in terminal]

    def get_pending_reroutes(self) -> List[Dict[str, Any]]:
        return [d for d in self.get_active_dispatches() if d["rerouteRequired"] and not d["isRerouted"]]

    def simulate_route_issue(self, dispatch_id: str, actor_role: str = "SUPPLY_CHAIN_MANAGER", actor_name: Optional[str] = None) -> Dict[str, Any]:
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM dispatches WHERE id = ?", (dispatch_id,)).fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Dispatch {dispatch_id} not found")
        if row["status"] != "IN_TRANSIT":
            conn.close()
            raise ValueError("A route issue can only be simulated for an IN_TRANSIT shipment")
        if row["is_rerouted"] or row["reroute_status"] in {"completed", "approved"}:
            conn.close()
            raise ValueError(f"Dispatch {dispatch_id} has already been rerouted")
        reason = "Simulated route blockage/delay"
        conn.execute("""
            UPDATE dispatches
            SET route_issue = 1, reroute_required = 1, reroute_status = 'pending', issue_reason = ?, status = 'IN_TRANSIT'
            WHERE id = ?
        """, (reason, dispatch_id))
        conn.execute("""
            UPDATE batches SET route_issue = 1, reroute_required = 1, reroute_status = 'pending'
            WHERE id = ?
        """, (row["batch_id"],))
        conn.commit()
        conn.close()
        try:
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(actor_n, actor_r, "ROUTE_ISSUE_SIMULATED", "DISPATCH", dispatch_id,
                f"Simulated route issue for dispatch {dispatch_id}: {reason}.", previous_status="IN_TRANSIT",
                new_status="IN_TRANSIT", details={"reason": reason, "demo": True}, facility="Indore Regional Logistics Operations")
        except Exception as exc:
            logger.warning(f"Failed to log simulated route issue: {exc}")
        return self.get_dispatch(dispatch_id)

    def reroute_existing_dispatch(self, dispatch_id: str, destination_id: str, reason: str, actor_role: str = "SUPPLY_CHAIN_MANAGER", actor_name: Optional[str] = None) -> Dict[str, Any]:
        dispatch = self.get_dispatch(dispatch_id)
        if not dispatch:
            raise ValueError(f"Dispatch {dispatch_id} not found")
        if dispatch["isRerouted"] or not dispatch["rerouteRequired"]:
            raise ValueError(f"Dispatch {dispatch_id} has no pending reroute")
        destination = routing_service.get_destination_by_id(destination_id)
        if not destination:
            raise ValueError(f"Destination {destination_id} not found")
        route = {**dispatch.get("route", {}), "destinationName": destination["name"], "distanceKm": destination["distanceKm"], "transitDurationHours": destination["travelTimeMinutes"] / 60, "isFeasible": True}
        conn = get_db_connection()
        conn.execute("""
            UPDATE dispatches SET destination_id = ?, destination = ?, status = 'REROUTED',
                route_details = ?, is_rerouted = 1, reroute_required = 0, route_issue = 0,
                reroute_status = 'completed', issue_reason = ?
            WHERE id = ?
        """, (destination_id, destination["name"], json.dumps(route), reason, dispatch_id))
        conn.execute("""
            UPDATE batches SET is_rerouted = 1, reroute_required = 0, route_issue = 0,
                reroute_status = 'completed', current_route = ?, recommended_action = json_set(COALESCE(recommended_action, '{}'), '$.status', 'APPROVED')
            WHERE id = ?
        """, (json.dumps(route), dispatch["batchId"]))
        conn.commit()
        conn.close()
        actor_n, actor_r = resolve_actor(actor_role, actor_name)
        audit_service.log_event(actor_n, actor_r, "REROUTE_COMPLETED", "DISPATCH", dispatch_id,
            f"Rerouted dispatch {dispatch_id} to {destination['name']}.", previous_status="IN_TRANSIT",
            new_status="REROUTED", details={"reason": reason, "destination_id": destination_id}, facility="Indore Regional Logistics Operations")
        return self.get_dispatch(dispatch_id)

    def get_at_risk_batches(self) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        rows = conn.execute("""
            SELECT b.* FROM batches b
            WHERE UPPER(COALESCE(b.risk_level, '')) IN ('CRITICAL', 'HIGH', 'MEDIUM')
              AND NOT EXISTS (
                SELECT 1 FROM dispatches d WHERE d.batch_id = b.id
                AND d.status NOT IN ('DELIVERED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'CANCELLED')
              )
            ORDER BY CASE UPPER(b.risk_level) WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END,
                     b.remaining_shelf_life_hours ASC
        """).fetchall()
        conn.close()
        try:
            from services.batch_service import row_to_batch_dict
        except ImportError:
            from backend.services.batch_service import row_to_batch_dict
        return [row_to_batch_dict(row) for row in rows]

    def check_route(self, batch_id: str, destination_id: str) -> Dict[str, Any]:
        batch = batch_service.get_batch_by_id(batch_id)
        if not batch:
            raise ValueError(f"Batch {batch_id} not found")
        destination = routing_service.get_destination_by_id(destination_id)
        if not destination:
            raise ValueError(f"Destination {destination_id} not found")
        result = routing_service.evaluate_route_feasibility(batch, {
            "destinationName": destination["name"],
            "transitDurationHours": destination["travelTimeMinutes"] / 60,
        })
        return {**result, "batchId": batch_id, "destination": destination}

    def execute_reroute(
        self,
        batch_id: str,
        target_destination_id: str,
        options: Optional[Dict[str, Any]] = None,
        actor_role: str = "SUPPLY_CHAIN_MANAGER",
        actor_name: Optional[str] = None
    ) -> Dict[str, Any]:
        batch = batch_service.get_batch_by_id(batch_id)
        if not batch:
            raise ValueError(f"Batch {batch_id} not found")
        if batch.get("isRerouted") or str(batch.get("rerouteStatus", "")).lower() in {"completed", "approved"}:
            raise ValueError(f"Batch {batch_id} has already been rerouted")

        dest = routing_service.get_destination_by_id(target_destination_id)
        if not dest:
            raise ValueError(f"Destination {target_destination_id} not found")
        dest_name = dest["name"]
        travel_time = dest["travelTimeMinutes"]

        # Mark batch action status as APPROVED
        batch_service.update_batch_action_status(batch_id, "APPROVED", actor_role=actor_role, actor_name=actor_name)

        # Create new dispatch record for Indore MP region
        dispatch_id = f"DISP-{random.randint(6000, 9999)}"
        new_disp = {
            "id": dispatch_id,
            "batch_id": batch_id,
            "produce": batch["produce"],
            "destination": dest_name,
            "status": "REROUTED",
            "carrier": "Indore Cold-Chain Logistics Fleet #18",
            "driver_name": "Deepak Patel",
            "driver_phone": "+91 98930 49211",
            "departure_time": "Just now",
            "eta": f"{travel_time} mins away",
            "progress_pct": 15,
            "current_coordinates": [22.7220, 75.8650],
            "temperature_maintained": "2.4°C (Compliant Re-chilled)",
            "waste_avoided_kg": batch["weightKg"],
            "recovered_value": batch["recommendedAction"].get("economicRecoveryEst", "₹1,085,000 (91%)"),
            "is_rerouted": 1,
            "reroute_required": 0,
            "route_issue": 0,
            "reroute_status": "completed"
        }

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO dispatches (
            id, batch_id, produce, destination, status, carrier, driver_name, driver_phone,
            departure_time, eta, progress_pct, current_coordinates, temperature_maintained,
            waste_avoided_kg, recovered_value, is_rerouted, reroute_required, route_issue, reroute_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_disp["id"], new_disp["batch_id"], new_disp["produce"], new_disp["destination"],
            new_disp["status"], new_disp["carrier"], new_disp["driver_name"], new_disp["driver_phone"],
            new_disp["departure_time"], new_disp["eta"], new_disp["progress_pct"],
            json.dumps(new_disp["current_coordinates"]), new_disp["temperature_maintained"],
            new_disp["waste_avoided_kg"], new_disp["recovered_value"], new_disp["is_rerouted"],
            new_disp["reroute_required"], new_disp["route_issue"], new_disp["reroute_status"]
        ))
        cursor.execute("""
            UPDATE batches SET is_rerouted = 1, reroute_required = 0, route_issue = 0,
                reroute_status = 'completed', current_route = ?, recommended_action = ?
            WHERE id = ?
        """, (
            json.dumps({**batch.get("currentRoute", {}), "destinationName": dest_name, "isFeasible": True}),
            json.dumps({**batch.get("recommendedAction", {}), "status": "APPROVED", "rerouteStatus": "completed"}),
            batch_id
        ))
        conn.commit()
        conn.close()

        # Log system audit event
        try:
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="REROUTE_COMPLETED",
                entity_type="DISPATCH",
                entity_id=dispatch_id,
                description=f"Approved reroute and generated dispatch {dispatch_id} for batch {batch_id} to {dest_name}.",
                previous_status="INFEASIBLE_ROUTE",
                new_status="REROUTED",
                details={
                    "batch_id": batch_id,
                    "destination": dest_name,
                    "target_destination_id": target_destination_id,
                    "waste_avoided_kg": batch["weightKg"],
                    "carrier": new_disp["carrier"]
                },
                facility="Indore Regional Logistics Operations"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit event for reroute: {e}")

        return {
            "success": True,
            "batchId": batch_id,
            "targetDestinationId": target_destination_id,
            "dispatchId": dispatch_id,
            "status": "REROUTED",
            "dispatchedAt": "Just now",
            "message": f"Reroute instruction approved and transmitted. Pallets dispatched to {dest_name}.",
            "dispatch": self.get_dispatch(dispatch_id)
        }

    def create_dispatch(
        self,
        batch_id: str,
        destination: str,
        carrier: Optional[str] = None,
        driver_name: Optional[str] = None,
        driver_phone: Optional[str] = None,
        eta: Optional[str] = None,
        temperature_maintained: Optional[str] = None,
        destination_id: Optional[str] = None,
        quantity_kg: Optional[float] = None,
        vehicle_id: Optional[str] = None,
        source: Optional[str] = None,
        route_details: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
        actor_role: str = "SUPPLY_CHAIN_MANAGER",
        actor_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a planned dispatch for a batch."""
        batch = batch_service.get_batch_by_id(batch_id)
        if not batch:
            raise ValueError(f"Batch {batch_id} not found")

        quantity = float(quantity_kg if quantity_kg is not None else batch["weightKg"])
        if quantity <= 0 or quantity > float(batch["weightKg"]):
            raise ValueError("Dispatch quantity must be greater than zero and no more than the available batch quantity")
        conn = get_db_connection()
        existing = conn.execute("SELECT id FROM dispatches WHERE batch_id = ? AND status NOT IN ('DELIVERED', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'CANCELLED')", (batch_id,)).fetchone()
        conn.close()
        if existing:
            raise ValueError(f"Batch {batch_id} already has an active dispatch")

        dispatch_id = f"DISP-{random.randint(6000, 9999)}"
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat() + "Z"

        carrier_name = carrier or "Indore Cold-Chain Logistics Fleet #12"
        driver = driver_name or "Ravi Mandloi"
        phone = driver_phone or "+91 98260 44321"
        est_eta = eta or "Within 45 mins"
        temp_spec = temperature_maintained or f"{batch['baselineTemp']}°C (Regulated)"
        coords = [22.7196, 75.8577]

        cursor.execute("""
        INSERT INTO dispatches (
            id, batch_id, produce, source, destination, destination_id, quantity_kg, vehicle_id, status, carrier, driver_name, driver_phone,
            departure_time, eta, progress_pct, current_coordinates, temperature_maintained,
            waste_avoided_kg, recovered_value, created_at, route_details, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PLANNED', ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dispatch_id, batch_id, batch["produce"], source or "Indore Central Cold-Storage Hub", destination,
            destination_id, quantity, vehicle_id or carrier_name, carrier_name, driver, phone, "Just now", est_eta, json.dumps(coords),
            temp_spec, quantity, f"₹{int(batch['estimatedValue'] * 85):,}", now, json.dumps(route_details or {}), notes
        ))
        conn.commit()
        conn.close()

        # Audit log
        try:
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="DISPATCH_CREATE",
                entity_type="DISPATCH",
                entity_id=dispatch_id,
                description=f"Created dispatch {dispatch_id} for batch {batch_id} to {destination}.",
                new_status="PLANNED",
                details={"batch_id": batch_id, "destination": destination, "carrier": carrier_name},
                facility="Indore Central Cold-Storage Hub"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit event for dispatch create: {e}")

        return {
            "success": True,
            "dispatchId": dispatch_id,
            "status": "PLANNED",
            "message": f"Dispatch {dispatch_id} created successfully."
        }

    def update_dispatch_status(
        self,
        dispatch_id: str,
        new_status: str,
        progress_pct: Optional[int] = None,
        notes: Optional[str] = None,
        actor_role: str = "SUPPLY_CHAIN_MANAGER",
        actor_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Validates and updates dispatch lifecycle status."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM dispatches WHERE id = ?", (dispatch_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Dispatch {dispatch_id} not found")

        current_status = row["status"]
        norm_new_status = new_status.upper().strip()

        # Valid transitions
        allowed = {
            "PLANNED": ["DISPATCHED", "CANCELLED"],
            "PREPARING": ["DISPATCHED", "CANCELLED"],
            "DISPATCHED": ["IN_TRANSIT", "ARRIVED", "DELIVERED", "CANCELLED"],
            "IN_TRANSIT": ["ARRIVED", "DELIVERED", "CANCELLED"],
            "ARRIVED": ["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED"],
            "DELIVERED": ["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED"],
            "ACCEPTED": [],
            "PARTIALLY_ACCEPTED": [],
            "REJECTED": []
        }

        if norm_new_status != current_status and norm_new_status not in allowed.get(current_status, []):
            conn.close()
            raise ValueError(f"Invalid status transition from '{current_status}' to '{norm_new_status}'. Allowed: {allowed.get(current_status, [])}")

        # Compute progress
        if progress_pct is not None:
            pct = max(0, min(100, int(progress_pct)))
        elif norm_new_status in ["ARRIVED", "DELIVERED", "ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED"]:
            pct = 100
        elif norm_new_status == "IN_TRANSIT":
            pct = max(50, row["progress_pct"] or 50)
        else:
            pct = row["progress_pct"] or 10

        cursor.execute("""
        UPDATE dispatches SET status = ?, progress_pct = ? WHERE id = ?
        """, (norm_new_status, pct, dispatch_id))
        conn.commit()
        conn.close()

        # Audit log
        try:
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="DISPATCH_STATUS_UPDATE",
                entity_type="DISPATCH",
                entity_id=dispatch_id,
                description=f"Updated dispatch {dispatch_id} status to '{norm_new_status}' ({pct}%).",
                previous_status=current_status,
                new_status=norm_new_status,
                details={"progress_pct": pct, "notes": notes},
                facility="Indore Logistics Control"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit event for dispatch status update: {e}")

        return {
            "success": True,
            "dispatchId": dispatch_id,
            "previousStatus": current_status,
            "status": norm_new_status,
            "progressPct": pct
        }

dispatch_service = DispatchService()

