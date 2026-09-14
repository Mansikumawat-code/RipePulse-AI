import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import random

try:
    from database.db import get_db_connection
    from services.audit_service import audit_service, resolve_actor
except ImportError:
    from backend.database.db import get_db_connection
    from backend.services.audit_service import audit_service, resolve_actor

logger = logging.getLogger("ripepulse.inquiry_service")

class InquiryService:
    def get_inquiries(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves persistent assessment inquiries from SQLite."""
        conn = get_db_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM inquiries WHERE 1=1"
        params = []
        if status and status.upper() != "ALL":
            query += " AND status = ?"
            params.append(status.upper())

        query += " ORDER BY created_at DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()

        inquiries = []
        for r in rows:
            inquiries.append({
                "id": r["id"],
                "name": r["name"],
                "email": r["email"],
                "organization": r["organization"],
                "message": r["message"],
                "warehouse_name": r["warehouse_name"] or r["name"],
                "volume_details": r["volume_details"] or r["message"],
                "status": r["status"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"]
            })
        return inquiries

    def create_inquiry(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Creates and stores a new assessment inquiry persistently in SQLite."""
        conn = get_db_connection()
        cursor = conn.cursor()

        # Generate readable ID
        cursor.execute("SELECT COUNT(*) FROM inquiries;")
        count = cursor.fetchone()[0]
        inq_id = f"INQ-{count + 1001}"

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        wh_name = payload.get("warehouse_name") or payload.get("warehouseName") or payload.get("name") or "Commercial Facility"
        email = payload.get("email") or ""
        org = payload.get("organization") or wh_name
        vol = payload.get("volume_details") or payload.get("volumeDetails") or payload.get("message") or "Commercial storage assessment request"
        msg = payload.get("message") or vol
        status = "NEW"

        cursor.execute("""
        INSERT INTO inquiries (
            id, name, email, organization, message, warehouse_name, volume_details, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (inq_id, wh_name, email, org, msg, wh_name, vol, status, now_str, now_str))

        conn.commit()
        conn.close()

        logger.info(f"New persistent assessment inquiry received: {inq_id} for {wh_name} ({email})")

        # System audit log
        try:
            audit_service.log_event(
                actor_name="Landing Page Visitor",
                actor_role="EXTERNAL",
                action="INQUIRY_SUBMITTED",
                entity_type="INQUIRY",
                entity_id=inq_id,
                description=f"Received assessment request from {wh_name} ({email}).",
                new_status="NEW",
                details={"warehouse_name": wh_name, "email": email, "volume_details": vol},
                facility="Online Portal"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit for inquiry creation: {e}")

        return {
            "id": inq_id,
            "name": wh_name,
            "email": email,
            "organization": org,
            "message": msg,
            "warehouse_name": wh_name,
            "volume_details": vol,
            "status": status,
            "created_at": now_str,
            "updated_at": now_str
        }

    def update_inquiry_status(
        self,
        inquiry_id: str,
        new_status: str,
        actor_role: str = "ADMIN",
        actor_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Updates status of an assessment inquiry in SQLite and logs audit event."""
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM inquiries WHERE id = ?", (inquiry_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        prev_status = row["status"]
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
        UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ?;
        """, (new_status.upper(), now_str, inquiry_id))

        conn.commit()
        conn.close()

        logger.info(f"Inquiry {inquiry_id} status updated from {prev_status} to {new_status}")

        # System audit log
        try:
            actor_n, actor_r = resolve_actor(actor_role, actor_name)
            audit_service.log_event(
                actor_name=actor_n,
                actor_role=actor_r,
                action="INQUIRY_STATUS_UPDATE",
                entity_type="INQUIRY",
                entity_id=inquiry_id,
                description=f"Updated status of inquiry {inquiry_id} to {new_status.upper()}.",
                previous_status=prev_status,
                new_status=new_status.upper(),
                details={"inquiry_id": inquiry_id, "warehouse_name": row["warehouse_name"]},
                facility="RipePulse Command Center"
            )
        except Exception as e:
            logger.warning(f"Failed to log audit for inquiry status update: {e}")

        return {
            "id": inquiry_id,
            "warehouse_name": row["warehouse_name"],
            "email": row["email"],
            "volume_details": row["volume_details"],
            "status": new_status.upper(),
            "created_at": row["created_at"],
            "updated_at": now_str
        }

    def delete_inquiry(self, inquiry_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM inquiries WHERE id = ?", (inquiry_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

inquiry_service = InquiryService()
