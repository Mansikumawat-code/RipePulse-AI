import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query

try:
    from services.audit_service import audit_service
    from auth_middleware import RoleChecker
except ImportError:
    from backend.services.audit_service import audit_service
    from backend.auth_middleware import RoleChecker

logger = logging.getLogger("ripepulse.routes.audit")
router = APIRouter(prefix="/audit-logs", tags=["System Audit Logs"])

# Admin-only role guard
admin_role_guard = RoleChecker(["ADMIN"])

@router.get("")
@router.get("/")
def get_audit_logs(
    role: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_role: str = Depends(admin_role_guard)
):
    """
    Retrieves persistent system audit logs. Restricted strictly to ADMIN role.
    """
    try:
        logs = audit_service.get_audit_logs(
            role=role,
            action=action,
            entity_type=entity_type,
            search=search,
            limit=limit
        )
        return {"success": True, "count": len(logs), "logs": logs}
    except Exception as e:
        logger.error(f"Failed to fetch audit logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
