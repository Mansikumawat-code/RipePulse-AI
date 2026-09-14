import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import random

try:
    from database.db import get_db_connection
except ImportError:
    from backend.database.db import get_db_connection

logger = logging.getLogger("ripepulse.audit_service")

def resolve_actor(role: Optional[str] = None, name: Optional[str] = None) -> tuple:
    """
    Safely derives (actor_name, actor_role) based on role header/parameter.
    Provides sensible role-based defaults without hardcoding a single user.
    """
    norm_role = (role or "WAREHOUSE_MANAGER").upper().strip()
    role_defaults = {
        "WAREHOUSE_MANAGER": ("Warehouse Supervisor", "WAREHOUSE_MANAGER"),
        "SUPPLY_CHAIN_MANAGER": ("Supply Chain Coordinator", "SUPPLY_CHAIN_MANAGER"),
        "ADMIN": ("System Administrator", "ADMIN"),
        "DESTINATION_RECEIVER": ("Destination Intake Staff", "DESTINATION_RECEIVER")
    }
    default_name, default_role = role_defaults.get(norm_role, ("System Operator", norm_role))
    final_name = name.strip() if name and name.strip() else default_name
    return (final_name, default_role)

class AuditService:
    def log_event(
        self,
        actor_name: str,
        actor_role: str,
        action: str,
        entity_type: str,
        description: str,
        entity_id: Optional[str] = None,
        previous_status: Optional[str] = None,
        new_status: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        facility: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Server-side reusable helper to record persistent system audit events in SQLite.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        log_id = f"AUD-{random.randint(100000, 999999)}"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        details_json = json.dumps(details) if details else None

        cursor.execute("""
        INSERT INTO audit_logs (
            id, actor_name, actor_role, action, entity_type, entity_id,
            description, previous_status, new_status, details, facility, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            log_id, actor_name, actor_role, action, entity_type, entity_id,
            description, previous_status, new_status, details_json, facility, timestamp
        ))

        conn.commit()
        conn.close()

        logger.info(f"Audit Logged [{log_id}]: {actor_role} ({actor_name}) performed '{action}' on {entity_type} {entity_id or ''}")

        return {
            "id": log_id,
            "actorName": actor_name,
            "actorRole": actor_role,
            "action": action,
            "entityType": entity_type,
            "entityId": entity_id,
            "description": description,
            "previousStatus": previous_status,
            "newStatus": new_status,
            "details": details,
            "facility": facility,
            "timestamp": timestamp
        }

    def get_audit_logs(
        self,
        role: Optional[str] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieves formatted audit logs with optional server-side filtering.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []

        if role and role.upper() != "ALL":
            query += " AND actor_role = ?"
            params.append(role.upper())

        if action and action.upper() != "ALL":
            query += " AND action = ?"
            params.append(action.upper())

        if entity_type and entity_type.upper() != "ALL":
            query += " AND entity_type = ?"
            params.append(entity_type.upper())

        if search:
            query += " AND (description LIKE ? OR actor_name LIKE ? OR entity_id LIKE ? OR id LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term, term])

        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        logs = []
        for r in rows:
            details_parsed = None
            if r["details"]:
                try:
                    details_parsed = json.loads(r["details"])
                except Exception:
                    details_parsed = r["details"]

            logs.append({
                "id": r["id"],
                "actorName": r["actor_name"],
                "actorRole": r["actor_role"],
                "action": r["action"],
                "entityType": r["entity_type"],
                "entityId": r["entity_id"],
                "description": r["description"],
                "previousStatus": r["previous_status"],
                "newStatus": r["new_status"],
                "details": details_parsed,
                "facility": r["facility"],
                "timestamp": r["timestamp"]
            })

        return logs

audit_service = AuditService()
