import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel

try:
    from services.batch_service import batch_service
    from services.dispatch_service import dispatch_service
    from auth_middleware import RoleChecker, get_current_actor
except ImportError:
    from backend.services.batch_service import batch_service
    from backend.services.dispatch_service import dispatch_service
    from backend.auth_middleware import RoleChecker, get_current_actor

logger = logging.getLogger("ripepulse.routes.batches")
router = APIRouter(tags=["Batches & Telemetry"])

# Role guards
warehouse_role_guard = RoleChecker(["WAREHOUSE_MANAGER", "ADMIN"])
action_role_guard = RoleChecker(["SUPPLY_CHAIN_MANAGER", "WAREHOUSE_MANAGER", "ADMIN"])

class ActionUpdateRequest(BaseModel):
    status: str

@router.get("/batches")
def get_all_batches():
    """Returns all active produce inventory batches with current AI risk and route feasibility."""
    return batch_service.get_all_batches()

@router.get("/batches/at-risk")
def get_at_risk_batches():
    """Returns prioritized risky batches that do not have an active dispatch."""
    return dispatch_service.get_at_risk_batches()

@router.get("/batches/{batch_id}")
def get_batch(batch_id: str):
    """Retrieves a single produce batch by its unique identifier (e.g. BAT-9042)."""
    batch = batch_service.get_batch_by_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    return batch

@router.post("/batches")
def create_batch(
    payload: Dict[str, Any] = Body(...),
    actor: Dict[str, str] = Depends(get_current_actor),
    current_role: str = Depends(warehouse_role_guard)
):
    """
    Ingests a new produce batch into warehouse inventory.
    Runs initial XGBoost shelf life prediction, computes initial SLI, and sets initial routing.
    Restricted to WAREHOUSE_MANAGER and ADMIN roles.
    """
    try:
        created = batch_service.create_batch(
            payload,
            actor_role=actor.get("role", "WAREHOUSE_MANAGER"),
            actor_name=actor.get("name")
        )
        return created
    except Exception as e:
        logger.error(f"Error creating batch: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create batch: {str(e)}")

@router.put("/batches/{batch_id}")
def update_batch(
    batch_id: str,
    payload: Dict[str, Any] = Body(...),
    actor: Dict[str, str] = Depends(get_current_actor),
    current_role: str = Depends(warehouse_role_guard)
):
    """Updates batch configuration. Restricted to WAREHOUSE_MANAGER and ADMIN."""
    try:
        return batch_service.update_batch(
            batch_id=batch_id,
            update_data=payload,
            actor_role=actor.get("role", "WAREHOUSE_MANAGER"),
            actor_name=actor.get("name")
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/batches/{batch_id}")
def delete_batch(
    batch_id: str,
    actor: Dict[str, str] = Depends(get_current_actor),
    current_role: str = Depends(warehouse_role_guard)
):
    """Deletes a batch. Restricted to WAREHOUSE_MANAGER and ADMIN."""
    try:
        batch_service.delete_batch(
            batch_id=batch_id,
            actor_role=actor.get("role", "WAREHOUSE_MANAGER"),
            actor_name=actor.get("name")
        )
        return {"success": True, "message": f"Batch {batch_id} deleted successfully."}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/batches/{batch_id}/action")
def update_batch_action(
    batch_id: str,
    update: ActionUpdateRequest,
    actor: Dict[str, str] = Depends(get_current_actor),
    current_role: str = Depends(action_role_guard)
):
    """Updates operational recommendation approval/fulfillment status (e.g. APPROVED, DELIVERED)."""
    res = batch_service.update_batch_action_status(
        batch_id,
        update.status,
        actor_role=actor.get("role", "SUPPLY_CHAIN_MANAGER"),
        actor_name=actor.get("name")
    )
    if not res.get("success"):
        raise HTTPException(status_code=404, detail=res.get("error", "Failed to update action"))
    return res

@router.get("/batches/{batch_id}/recommendation")
def get_batch_recommendation(batch_id: str):
    """Retrieves current dynamic routing recommendation for an individual batch."""
    batch = batch_service.get_batch_by_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    return batch.get("recommendedAction", {})

@router.get("/batches/{batch_id}/prediction")
def get_batch_prediction(batch_id: str):
    """
    Returns latest stored AI prediction result for a batch — RSL, SLI, risk, confidence,
    and explainability fields. Frontend uses this to render the AI panel without waiting
    for a new telemetry reading.
    """
    batch = batch_service.get_batch_by_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

    try:
        from config import HONESTY_DISCLAIMER
    except ImportError:
        from backend.config import HONESTY_DISCLAIMER

    return {
        "batchId": batch_id,
        "produce": batch.get("produce"),
        "remainingShelfLifeHours": batch.get("remainingShelfLifeHours"),
        "remainingShelfLifeDays": round((batch.get("remainingShelfLifeHours") or 0) / 24.0, 2),
        "initialShelfLifeHours": batch.get("initialShelfLifeHours"),
        "sli": batch.get("sli"),
        "riskLevel": batch.get("riskLevel"),
        "confidenceScore": batch.get("confidenceScore"),
        "decayRateFactor": batch.get("decayRateFactor"),
        "disclaimer": HONESTY_DISCLAIMER
    }

@router.get("/batches/{batch_id}/telemetry")
def get_batch_telemetry(batch_id: str):
    """Retrieves 24-hour historical time-series telemetry (temp, humidity, VOC, SLI) for charts."""
    return batch_service.get_batch_telemetry(batch_id)

class TelemetryIngestRequest(BaseModel):
    batch_id: Optional[str] = None
    batchId: Optional[str] = None
    temperature: float
    humidity: float
    voc: float
    timestamp: Optional[str] = None

@router.post("/telemetry")
async def ingest_telemetry(payload: TelemetryIngestRequest):
    """
    Ingests mock or physical IoT sensor readings into backend.
    Saves reading in SQLite, triggers XGBoost ML prediction, updates SLI,
    derives Risk level, evaluates route feasibility, and broadcasts via WebSocket.
    """
    try:
        from simulator.telemetry_simulator import telemetry_simulator
    except ImportError:
        from backend.simulator.telemetry_simulator import telemetry_simulator

    target_id = payload.batch_id or payload.batchId or "BAT-9042"
    try:
        result = await telemetry_simulator.process_telemetry_reading(
            batch_id=target_id,
            temperature=payload.temperature,
            humidity=payload.humidity,
            voc=payload.voc,
            timestamp=payload.timestamp
        )
        return result
    except Exception as e:
        logger.error(f"Telemetry ingestion failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/batches/{batch_id}/telemetry")
async def ingest_batch_telemetry(batch_id: str, payload: TelemetryIngestRequest):
    """Convenience endpoint for ingesting telemetry for a specific batch ID."""
    try:
        from simulator.telemetry_simulator import telemetry_simulator
    except ImportError:
        from backend.simulator.telemetry_simulator import telemetry_simulator

    try:
        result = await telemetry_simulator.process_telemetry_reading(
            batch_id=batch_id,
            temperature=payload.temperature,
            humidity=payload.humidity,
            voc=payload.voc,
            timestamp=payload.timestamp
        )
        return result
    except Exception as e:
        logger.error(f"Telemetry ingestion for {batch_id} failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/warehouses/{warehouse_id}/telemetry")
def get_warehouse_telemetry(warehouse_id: str = "WH-CA-01"):
    """Retrieves aggregate cold-storage chamber metrics and sensor health."""
    return batch_service.get_warehouse_telemetry(warehouse_id)

