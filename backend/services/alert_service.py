import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    from database.db import get_db_connection
except ImportError:
    from backend.database.db import get_db_connection

logger = logging.getLogger("ripepulse.alert_service")

class AlertService:
    def get_all_alerts(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()

        all_alerts = [
            {
                "id": r["id"],
                "batchId": r["batch_id"],
                "produce": r["produce"],
                "severity": r["severity"],
                "title": r["title"],
                "message": r["message"],
                "timestamp": r["timestamp"],
                "status": r["status"],
                "actionRequired": r["action_required"]
            }
            for r in rows
        ]

        if not role or role.upper() in ["ADMIN", "ALL"]:
            return all_alerts

        norm_role = role.upper().strip()
        filtered = []
        for a in all_alerts:
            text = f"{a['title']} {a['message']} {a.get('actionRequired', '')}".lower()
            if norm_role == "WAREHOUSE_MANAGER":
                # Chamber, sensor, storage, bay, temperature spike, humidity
                if any(k in text for k in ["zone", "bay", "chamber", "sensor", "calibration", "thermal", "storage", "pallet", "respiration", "refrigeration"]):
                    filtered.append(a)
                elif "reroute" not in text and "transit" not in text:
                    filtered.append(a)
            elif norm_role == "SUPPLY_CHAIN_MANAGER":
                # Route, transit, reroute, infeasible, cutoff, dispatch
                if any(k in text for k in ["route", "transit", "reroute", "infeasib", "dispatch", "cutoff", "destination"]):
                    filtered.append(a)
                elif a["severity"] in ["CRITICAL", "HIGH"]:
                    filtered.append(a)
            elif norm_role == "DESTINATION_RECEIVER":
                # Arrival, delivery, intake, shipment, condition
                if any(k in text for k in ["arrived", "deliver", "intake", "shipment", "receipt", "damage"]):
                    filtered.append(a)
            else:
                filtered.append(a)

        return filtered if filtered else all_alerts

    def acknowledge_alert(self, alert_id: str, actor_role: str = "WAREHOUSE_MANAGER", actor_name: Optional[str] = None) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
        alert = cursor.fetchone()
        prev_status = alert["status"] if alert else "UNRESOLVED"

        cursor.execute("UPDATE alerts SET status = 'ACKNOWLEDGED' WHERE id = ?", (alert_id,))
        conn.commit()
        conn.close()

        # Log system audit event
        try:
            from services.audit_service import audit_service, resolve_actor
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="ALERT_ACKNOWLEDGE",
                entity_type="ALERT",
                entity_id=alert_id,
                description=f"Acknowledged alert {alert_id} ({alert['title'] if alert else ''}).",
                previous_status=prev_status,
                new_status="ACKNOWLEDGED",
                details={"batch_id": alert["batch_id"] if alert else None, "produce": alert["produce"] if alert else None},
                facility="Indore Operations"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit event for alert acknowledge: {e}")

        return {"success": True, "alertId": alert_id, "status": "ACKNOWLEDGED"}

    def resolve_alert(self, alert_id: str, actor_role: str = "WAREHOUSE_MANAGER", actor_name: Optional[str] = None) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
        alert = cursor.fetchone()
        prev_status = alert["status"] if alert else "UNRESOLVED"

        cursor.execute("UPDATE alerts SET status = 'RESOLVED' WHERE id = ?", (alert_id,))
        conn.commit()
        conn.close()

        # Log system audit event
        try:
            from services.audit_service import audit_service, resolve_actor
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="ALERT_RESOLVE",
                entity_type="ALERT",
                entity_id=alert_id,
                description=f"Resolved alert {alert_id} ({alert['title'] if alert else ''}).",
                previous_status=prev_status,
                new_status="RESOLVED",
                details={"batch_id": alert["batch_id"] if alert else None, "produce": alert["produce"] if alert else None},
                facility="Indore Operations"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit event for alert resolve: {e}")

        return {"success": True, "alertId": alert_id, "status": "RESOLVED"}

    def create_alert(
        self,
        batch_id: str,
        produce: str,
        severity: str,
        title: str,
        message: str,
        action_required: str
    ) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Deduplication check: prevent identical unresolved alert spam on refresh
        cursor.execute("""
        SELECT id FROM alerts WHERE batch_id = ? AND title = ? AND status = 'UNRESOLVED'
        """, (batch_id, title))
        dup = cursor.fetchone()
        if dup:
            conn.close()
            return {
                "id": dup["id"],
                "batchId": batch_id,
                "produce": produce,
                "severity": severity,
                "title": title,
                "message": message,
                "timestamp": "Active",
                "status": "UNRESOLVED",
                "actionRequired": action_required
            }

        import random
        alert_id = f"ALT-{random.randint(2000, 9999)}"
        timestamp = "Just now"

        cursor.execute("""
        INSERT INTO alerts (id, batch_id, produce, severity, title, message, timestamp, status, action_required)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'UNRESOLVED', ?)
        """, (alert_id, batch_id, produce, severity, title, message, timestamp, action_required))
        conn.commit()
        conn.close()

        return {
            "id": alert_id,
            "batchId": batch_id,
            "produce": produce,
            "severity": severity,
            "title": title,
            "message": message,
            "timestamp": timestamp,
            "status": "UNRESOLVED",
            "actionRequired": action_required
        }

    def get_risk_summary(self) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Batch risk counts and at-risk value
        cursor.execute("SELECT risk_level, estimated_value FROM batches")
        batch_rows = cursor.fetchall()

        critical_cnt = sum(1 for r in batch_rows if r["risk_level"] == "CRITICAL")
        high_cnt = sum(1 for r in batch_rows if r["risk_level"] == "HIGH")
        medium_cnt = sum(1 for r in batch_rows if r["risk_level"] == "MEDIUM")
        low_cnt = sum(1 for r in batch_rows if r["risk_level"] == "LOW")

        at_risk_value = sum(
            float(r["estimated_value"] or 0)
            for r in batch_rows
            if r["risk_level"] in ["CRITICAL", "HIGH"]
        )

        # Waste prevented and recovered value computed from actual dispatch records
        cursor.execute("SELECT waste_avoided_kg, recovered_value FROM dispatches")
        dispatch_rows = cursor.fetchall()
        conn.close()

        waste_prevented_kg = sum(
            float(r["waste_avoided_kg"] or 0) for r in dispatch_rows
        )

        recovered_value_total = 0.0
        for r in dispatch_rows:
            rv = r["recovered_value"]
            if rv:
                # Strip currency symbols, commas, and take the leading number
                match = re.search(r"[\d,]+(?:\.\d+)?", str(rv).replace(",", ""))
                if match:
                    try:
                        recovered_value_total += float(match.group().replace(",", ""))
                    except ValueError:
                        pass

        return {
            "criticalCount": critical_cnt,
            "highCount": high_cnt,
            "mediumCount": medium_cnt,
            "lowCount": low_cnt,
            "totalAtRiskValue": at_risk_value,
            "wastePreventedThisMonthKg": round(waste_prevented_kg, 2),
            "wastePreventedThisMonthValue": round(recovered_value_total, 2)
        }

alert_service = AlertService()
