import logging
import json
from contextlib import asynccontextmanager
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Header, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

try:
    from config import API_PREFIX, CORS_ORIGINS, HONESTY_DISCLAIMER, HOST, PORT
    from model.model_loader import model_loader
    from routes.prediction import router as prediction_router
    from routes.batches import router as batches_router
    from routes.routing import router as routing_router
    from routes.receipts import router as receipts_router
    from routes.audit import router as audit_router
    from database.seed_data import seed_database
    from services.alert_service import alert_service
    from services.inquiry_service import inquiry_service
    from auth_middleware import RoleChecker, get_current_actor, get_current_role
    from simulator.telemetry_simulator import telemetry_simulator
    from simulator.websocket_manager import ws_manager
except ImportError:
    from backend.config import API_PREFIX, CORS_ORIGINS, HONESTY_DISCLAIMER, HOST, PORT
    from backend.model.model_loader import model_loader
    from backend.routes.prediction import router as prediction_router
    from backend.routes.batches import router as batches_router
    from backend.routes.routing import router as routing_router
    from backend.routes.receipts import router as receipts_router
    from backend.routes.audit import router as audit_router
    from backend.database.seed_data import seed_database
    from backend.services.alert_service import alert_service
    from backend.services.inquiry_service import inquiry_service
    from backend.auth_middleware import RoleChecker, get_current_actor, get_current_role
    from backend.simulator.telemetry_simulator import telemetry_simulator
    from backend.simulator.websocket_manager import ws_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ripepulse.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing RipePulse AI Backend...")
    try:
        seed_database()
        logger.info("SQLite database verified and initialized.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

    try:
        model_loader.load_model()
        logger.info("XGBoost Regression Model successfully loaded on startup.")
    except Exception as e:
        logger.error(f"Model initialization error: {e}")
    yield
    logger.info("RipePulse AI Backend shutting down...")

app = FastAPI(
    title="RipePulse AI API",
    description=(
        "Backend service for RipePulse AI — predictive produce shelf-life intelligence "
        "and dynamic redistribution.\n\n"
        f"**Note**: {HONESTY_DISCLAIMER}"
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Health & Root ────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "project": "RipePulse AI",
        "tagline": "Predict. Prioritize. Prevent Produce Waste.",
        "status": "online",
        "docs_url": "/docs",
        "model_loaded": model_loader.is_loaded,
        "disclaimer": HONESTY_DISCLAIMER
    }

@app.get(f"{API_PREFIX}/health")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_status": "loaded" if model_loader.is_loaded else "unavailable",
        "input_features": model_loader._feature_names,
        "disclaimer": HONESTY_DISCLAIMER
    }

# ─── Alerts Routes ───────────────────────────────────────────────────────────
alert_action_guard = RoleChecker(["WAREHOUSE_MANAGER", "SUPPLY_CHAIN_MANAGER", "ADMIN"])

@app.get(f"{API_PREFIX}/alerts")
@app.get("/alerts")
def get_alerts(
    role: Optional[str] = Query(None),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    """Returns system alerts, optionally filtered for the caller's operational domain."""
    active_role = role or x_user_role
    return alert_service.get_all_alerts(role=active_role)

@app.patch(f"{API_PREFIX}/alerts/{{alert_id}}/acknowledge")
@app.patch("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    actor: dict = Depends(get_current_actor),
    role: str = Depends(alert_action_guard)
):
    return alert_service.acknowledge_alert(
        alert_id=alert_id,
        actor_role=actor.get("role", "WAREHOUSE_MANAGER"),
        actor_name=actor.get("name")
    )

@app.patch(f"{API_PREFIX}/alerts/{{alert_id}}/resolve")
@app.patch("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    actor: dict = Depends(get_current_actor),
    role: str = Depends(alert_action_guard)
):
    return alert_service.resolve_alert(
        alert_id=alert_id,
        actor_role=actor.get("role", "WAREHOUSE_MANAGER"),
        actor_name=actor.get("name")
    )

@app.get(f"{API_PREFIX}/risk-summary")
@app.get("/risk-summary")
def get_risk_summary():
    """Returns aggregate risk summary for the command dashboard KPI cards."""
    return alert_service.get_risk_summary()

# ─── Simulation / Demo Routes ────────────────────────────────────────────────
@app.post(f"{API_PREFIX}/simulate/step")
@app.post("/simulate/step")
async def simulate_step(payload: dict = None):
    """
    Triggers a single telemetry simulation step for the given batch.
    Runs XGBoost prediction, updates SLI/Risk, evaluates route feasibility,
    and broadcasts result to WebSocket clients.
    """
    if payload is None:
        payload = {}
    batch_id = payload.get("batchId", "BAT-9042")
    scenario = payload.get("scenario", "NORMAL")
    result = await telemetry_simulator.step_batch_simulation(
        batch_id=batch_id,
        scenario=scenario
    )
    return result

@app.post(f"{API_PREFIX}/simulate/stress")
@app.post("/simulate/stress")
async def simulate_stress(payload: dict = None):
    """
    Triggers thermal abuse & ethylene surge simulation for a batch.
    Predicts collapsed RSL via XGBoost, marks route INFEASIBLE, generates CRITICAL alert,
    and identifies partner redistribution facility.
    """
    if payload is None:
        payload = {}
    batch_id = payload.get("batchId", "BAT-9042")
    return await telemetry_simulator.step_batch_simulation(
        batch_id=batch_id,
        scenario="STRESS"
    )

@app.post(f"{API_PREFIX}/simulate/recovery")
@app.post("/simulate/recovery")
async def simulate_recovery(payload: dict = None):
    """
    Triggers cold-chain re-chilling & air scrubbing recovery simulation.
    Returns temperatures to optimal baseline and stabilizes shelf-life.
    """
    if payload is None:
        payload = {}
    batch_id = payload.get("batchId", "BAT-9042")
    return await telemetry_simulator.step_batch_simulation(
        batch_id=batch_id,
        scenario="RECOVERY"
    )

@app.post(f"{API_PREFIX}/simulate/toggle-ticker")
@app.post("/simulate/toggle-ticker")
async def toggle_simulator_ticker(payload: dict = None):
    """
    Starts or stops the continuous periodic 4-second mock sensor ticker.
    """
    if payload is None:
        payload = {}
    batch_id = payload.get("batchId", "BAT-9042")
    if telemetry_simulator.is_ticker_running:
        return await telemetry_simulator.stop_ticker()
    else:
        return await telemetry_simulator.start_ticker(batch_id=batch_id, interval_seconds=4.0)

@app.get(f"{API_PREFIX}/simulate/status")
@app.get("/simulate/status")
def get_simulator_status():
    """Returns current active scenario and background ticker status."""
    return {
        "currentScenario": telemetry_simulator.current_scenario,
        "isTickerRunning": telemetry_simulator.is_ticker_running,
        "activeBatchId": telemetry_simulator._active_batch_id
    }


# ─── WebSocket Endpoint ───────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry push updates.
    Frontend connects here to receive live SLI, risk, and route updates.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Allow client to trigger a simulation step via WS
                if msg.get("type") == "SIMULATE_STEP":
                    result = await telemetry_simulator.step_batch_simulation(
                        batch_id=msg.get("batchId", "BAT-9042"),
                        scenario=msg.get("scenario", "NORMAL")
                    )
                    await websocket.send_json(result)
            except Exception as e:
                logger.warning(f"WebSocket message handling error: {e}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# ─── Assessment Inquiries (Admin Panel & Landing Page) ────────────────────────
admin_inquiry_guard = RoleChecker(["ADMIN"])

@app.get(f"{API_PREFIX}/inquiries")
@app.get("/inquiries")
@app.get("/api/v1/inquiries")
def get_inquiries(
    status: Optional[str] = Query(None),
    role: str = Depends(admin_inquiry_guard)
):
    """Returns all warehouse integration assessment inquiries from persistent SQLite storage (Admin only)."""
    inquiries = inquiry_service.get_inquiries(status=status)
    return {"success": True, "inquiries": inquiries}

@app.post(f"{API_PREFIX}/inquiries")
@app.post("/inquiries")
@app.post("/api/v1/inquiries")
def create_inquiry(payload: dict):
    """Receives a new warehouse assessment request from the landing page form and stores in SQLite."""
    inquiry = inquiry_service.create_inquiry(payload)
    return {"success": True, "inquiry": inquiry}

@app.patch(f"{API_PREFIX}/inquiries/{{inquiry_id}}")
@app.patch("/inquiries/{inquiry_id}")
@app.patch("/api/v1/inquiries/{inquiry_id}")
def update_inquiry(
    inquiry_id: str,
    payload: dict,
    actor: dict = Depends(get_current_actor),
    role: str = Depends(admin_inquiry_guard)
):
    """Updates status of an assessment inquiry in SQLite with audit logging (Admin only)."""
    status_val = payload.get("status", "REVIEWED")
    updated = inquiry_service.update_inquiry_status(
        inquiry_id=inquiry_id,
        new_status=status_val,
        actor_role=actor.get("role", "ADMIN"),
        actor_name=actor.get("name")
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Inquiry {inquiry_id} not found")
    return {"success": True, "inquiry": updated}

@app.delete(f"{API_PREFIX}/inquiries/{{inquiry_id}}")
@app.delete("/inquiries/{inquiry_id}")
@app.delete("/api/v1/inquiries/{inquiry_id}")
def delete_inquiry(
    inquiry_id: str,
    actor: dict = Depends(get_current_actor),
    role: str = Depends(admin_inquiry_guard)
):
    """Deletes an inquiry from SQLite (Admin only)."""
    deleted = inquiry_service.delete_inquiry(inquiry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Inquiry {inquiry_id} not found")
    return {"success": True, "message": "Inquiry deleted successfully"}

# ─── Mount All Routers ────────────────────────────────────────────────────────
# Prediction routes
app.include_router(prediction_router, prefix=API_PREFIX)
app.include_router(prediction_router)

# Batches & telemetry routes
app.include_router(batches_router, prefix=API_PREFIX)
app.include_router(batches_router)

# Routing, destinations & dispatch routes
app.include_router(routing_router, prefix=API_PREFIX)
app.include_router(routing_router)

# Receiver intake & receipt verification routes
app.include_router(receipts_router, prefix=API_PREFIX)
app.include_router(receipts_router)

# System audit log routes (Admin only)
app.include_router(audit_router, prefix=API_PREFIX)
app.include_router(audit_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
