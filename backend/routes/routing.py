import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body, Depends
from pydantic import BaseModel, Field

try:
    from services.routing_service import routing_service
    from services.dispatch_service import dispatch_service
    from services.batch_service import batch_service
    from auth_middleware import RoleChecker, get_current_actor
except ImportError:
    from backend.services.routing_service import routing_service
    from backend.services.dispatch_service import dispatch_service
    from backend.services.batch_service import batch_service
    from backend.auth_middleware import RoleChecker, get_current_actor

logger = logging.getLogger("ripepulse.routes.routing")
router = APIRouter(tags=["Routing & Redistribution"])

supply_chain_guard = RoleChecker(["SUPPLY_CHAIN_MANAGER", "ADMIN"])
status_update_guard = RoleChecker(["SUPPLY_CHAIN_MANAGER", "ADMIN", "DESTINATION_RECEIVER"])

class RouteEvaluationRequest(BaseModel):
    batchId: str
    route: Dict[str, Any]

class RerouteExecutionRequest(BaseModel):
    batchId: str
    targetDestinationId: str
    options: Optional[Dict[str, Any]] = None

class CreateDispatchRequest(BaseModel):
    batchId: str
    destination: str
    destinationId: Optional[str] = None
    quantityKg: Optional[float] = Field(None, gt=0)
    vehicleId: Optional[str] = None
    source: Optional[str] = None
    carrier: Optional[str] = None
    driverName: Optional[str] = None
    driverPhone: Optional[str] = None
    eta: Optional[str] = None
    temperatureMaintained: Optional[str] = None
    route: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class DispatchStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Target status: DISPATCHED, IN_TRANSIT, ARRIVED, DELIVERED, CANCELLED")
    progressPct: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = None

class RouteCheckRequest(BaseModel):
    batchId: str
    destinationId: str

class RouteAssignmentRequest(BaseModel):
    destinationId: str
    route: Dict[str, Any]

class RerouteRequest(BaseModel):
    destinationId: str
    reason: str = Field(..., min_length=3)

class DemoRouteIssueRequest(BaseModel):
    reason: str = "Simulated route blockage/delay"

@router.post("/routing/evaluate")
def evaluate_route(request: RouteEvaluationRequest):
    """Evaluates planned transit feasibility against remaining produce shelf life."""
    batch = batch_service.get_batch_by_id(request.batchId)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {request.batchId} not found")
    return routing_service.evaluate_route_feasibility(batch, request.route)

@router.get("/batches/at-risk")
def get_at_risk_batches():
    return dispatch_service.get_at_risk_batches()

@router.post("/routes/check")
def check_route(request: RouteCheckRequest):
    try:
        return dispatch_service.check_route(request.batchId, request.destinationId)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/reroute/execute")
def execute_reroute(
    request: RerouteExecutionRequest,
    actor: Dict[str, str] = Depends(get_current_actor),
    current_role: str = Depends(supply_chain_guard)
):
    """Approves reroute and dispatches produce batch to alternative partner facility."""
    try:
        res = dispatch_service.execute_reroute(
            batch_id=request.batchId,
            target_destination_id=request.targetDestinationId,
            options=request.options,
            actor_role=actor.get("role", "SUPPLY_CHAIN_MANAGER"),
            actor_name=actor.get("name")
        )
        return res
    except Exception as e:
        logger.error(f"Failed to execute reroute: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/destinations")
def get_destinations(batchId: Optional[str] = Query(None)):
    """Retrieves all alternative receiving facilities (processors, grocers, food banks)."""
    return routing_service.get_all_destinations(batch_id=batchId)

@router.get("/destinations/{destination_id}")
def get_destination(destination_id: str):
    """Retrieves single destination facility details by ID."""
    dest = routing_service.get_destination_by_id(destination_id)
    if not dest:
        raise HTTPException(status_code=404, detail=f"Destination {destination_id} not found")
    return dest

@router.get("/dispatches")
def get_dispatches():
    """Retrieves active cold-chain fleet dispatches."""
    return dispatch_service.get_all_dispatches()

@router.post("/dispatches")
def create_dispatch(
    payload: CreateDispatchRequest,
    actor: Dict[str, str] = Depends(get_current_actor),
    current_role: str = Depends(supply_chain_guard)
):
    """Creates a new outbound dispatch for a batch. Restricted to SUPPLY_CHAIN_MANAGER and ADMIN."""
    try:
        return dispatch_service.create_dispatch(
            batch_id=payload.batchId,
            destination=payload.destination,
            carrier=payload.carrier,
            driver_name=payload.driverName,
            driver_phone=payload.driverPhone,
            eta=payload.eta,
            temperature_maintained=payload.temperatureMaintained,
            destination_id=payload.destinationId,
            quantity_kg=payload.quantityKg,
            vehicle_id=payload.vehicleId,
            source=payload.source,
            route_details=payload.route,
            notes=payload.notes,
            actor_role=actor.get("role", "SUPPLY_CHAIN_MANAGER"),
            actor_name=actor.get("name")
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dispatches/{dispatch_id}")
def get_dispatch(dispatch_id: str):
    dispatch = dispatch_service.get_dispatch(dispatch_id)
    if not dispatch:
        raise HTTPException(status_code=404, detail=f"Dispatch {dispatch_id} not found")
    return dispatch

@router.get("/shipments/active")
def get_active_shipments():
    return dispatch_service.get_active_dispatches()

@router.get("/reroutes/pending")
def get_pending_reroutes():
    return dispatch_service.get_pending_reroutes()

@router.post("/dispatches/{dispatch_id}/simulate-route-issue")
def simulate_route_issue(dispatch_id: str, request: DemoRouteIssueRequest, actor: Dict[str, str] = Depends(get_current_actor), current_role: str = Depends(supply_chain_guard)):
    try:
        return dispatch_service.simulate_route_issue(dispatch_id, actor_role=actor.get("role", "SUPPLY_CHAIN_MANAGER"), actor_name=actor.get("name"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/dispatches/{dispatch_id}/assign-route")
def assign_route(dispatch_id: str, request: RouteAssignmentRequest, actor: Dict[str, str] = Depends(get_current_actor), current_role: str = Depends(supply_chain_guard)):
    dispatch = dispatch_service.get_dispatch(dispatch_id)
    if not dispatch:
        raise HTTPException(status_code=404, detail=f"Dispatch {dispatch_id} not found")
    try:
        from database.db import get_db_connection
    except ImportError:
        from backend.database.db import get_db_connection
    import json
    conn = get_db_connection()
    conn.execute("UPDATE dispatches SET destination_id = ?, route_details = ? WHERE id = ?", (request.destinationId, json.dumps(request.route), dispatch_id))
    conn.commit()
    conn.close()
    return {"success": True, "dispatchId": dispatch_id, "status": "PLANNED", "route": request.route}

@router.post("/dispatches/{dispatch_id}/reroute")
def reroute_dispatch(dispatch_id: str, request: RerouteRequest, actor: Dict[str, str] = Depends(get_current_actor), current_role: str = Depends(supply_chain_guard)):
    try:
        dispatch = dispatch_service.reroute_existing_dispatch(
            dispatch_id, request.destinationId, request.reason,
            actor_role=actor.get("role", "SUPPLY_CHAIN_MANAGER"), actor_name=actor.get("name")
        )
        return {"success": True, "dispatchId": dispatch_id, "status": "REROUTED", "dispatch": dispatch}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.patch("/dispatches/{dispatch_id}/status")
def update_dispatch_status(
    dispatch_id: str,
    payload: DispatchStatusUpdateRequest,
    actor: Dict[str, str] = Depends(get_current_actor),
    current_role: str = Depends(status_update_guard)
):
    """Updates dispatch lifecycle status with strict transition validation."""
    try:
        return dispatch_service.update_dispatch_status(
            dispatch_id=dispatch_id,
            new_status=payload.status,
            progress_pct=payload.progressPct,
            notes=payload.notes,
            actor_role=actor.get("role", "SUPPLY_CHAIN_MANAGER"),
            actor_name=actor.get("name")
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
