"""
RipePulse AI - Role Validation Middleware & Dependencies
Supports demo mode role selection via HTTP Header `X-User-Role`, `X-User-Name`, or query params.
Compatible with FastAPI request injection.
"""

from fastapi import Header, HTTPException, Query, status
from typing import Optional, List, Dict
import logging

logger = logging.getLogger("ripepulse.auth")

VALID_ROLES = [
    "WAREHOUSE_MANAGER",
    "SUPPLY_CHAIN_MANAGER",
    "ADMIN",
    "DESTINATION_RECEIVER"
]

ROLE_DEFAULT_NAMES = {
    "WAREHOUSE_MANAGER": "Elena Vance",
    "SUPPLY_CHAIN_MANAGER": "Marcus Chen",
    "ADMIN": "Dr. Maya Lin",
    "DESTINATION_RECEIVER": "Rajesh Sharma"
}

def get_current_role(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    role: Optional[str] = Query(None)
) -> str:
    """
    Extracts active role from header or query param.
    Defaults to 'WAREHOUSE_MANAGER' in demo mode for backwards compatibility.
    """
    active_role = x_user_role or role or "WAREHOUSE_MANAGER"
    active_role = active_role.upper().strip()
    
    if active_role not in VALID_ROLES:
        logger.warning(f"Unrecognized role requested: {active_role}, falling back to WAREHOUSE_MANAGER")
        return "WAREHOUSE_MANAGER"
        
    return active_role

def get_current_actor(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    role: Optional[str] = Query(None),
    name: Optional[str] = Query(None)
) -> Dict[str, str]:
    """
    Extracts active actor (role and name) from headers/query params.
    """
    active_role = (x_user_role or role or "WAREHOUSE_MANAGER").upper().strip()
    if active_role not in VALID_ROLES:
        active_role = "WAREHOUSE_MANAGER"
        
    default_name = ROLE_DEFAULT_NAMES.get(active_role, "System Operator")
    active_name = (x_user_name or name or default_name).strip()
    
    return {
        "role": active_role,
        "name": active_name
    }

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = [r.upper() for r in allowed_roles]

    def __call__(
        self,
        current_role: str = Header("WAREHOUSE_MANAGER", alias="X-User-Role"),
        current_name: Optional[str] = Header(None, alias="X-User-Name")
    ) -> str:
        normalized = current_role.upper().strip()
        if normalized not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{normalized}' is not authorized. Required: {self.allowed_roles}"
            )
        return normalized
