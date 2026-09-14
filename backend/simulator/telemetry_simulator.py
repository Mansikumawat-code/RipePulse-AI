import asyncio
import json
import logging
import random
from datetime import datetime
from typing import Dict, Any, Optional

try:
    from database.db import get_db_connection
    from model.model_loader import model_loader
    from services.risk_engine import (
        calculate_sli,
        derive_risk_level,
        calculate_explainability,
        calculate_prototype_confidence
    )
    from services.routing_service import routing_service
    from services.alert_service import alert_service
    from simulator.websocket_manager import ws_manager
    from config import HONESTY_DISCLAIMER, PRODUCE_OPTIMAL_BASELINES
except ImportError:
    from backend.database.db import get_db_connection
    from backend.model.model_loader import model_loader
    from backend.services.risk_engine import (
        calculate_sli,
        derive_risk_level,
        calculate_explainability,
        calculate_prototype_confidence
    )
    from backend.services.routing_service import routing_service
    from backend.services.alert_service import alert_service
    from backend.simulator.websocket_manager import ws_manager
    from backend.config import HONESTY_DISCLAIMER, PRODUCE_OPTIMAL_BASELINES

logger = logging.getLogger("ripepulse.simulator")

class TelemetrySimulator:
    def __init__(self):
        self.current_scenario = "NORMAL"
        self._ticker_task: Optional[asyncio.Task] = None
        self._ticker_running = False
        self._active_batch_id = "BAT-9042"

    @property
    def is_ticker_running(self) -> bool:
        return self._ticker_running

    async def start_ticker(self, batch_id: str = "BAT-9042", interval_seconds: float = 4.0):
        if self._ticker_running:
            return {"status": "already_running", "batchId": self._active_batch_id}
        self._active_batch_id = batch_id
        self._ticker_running = True
        self._ticker_task = asyncio.create_task(self._run_ticker(interval_seconds))
        logger.info(f"Started continuous telemetry simulator ticker for {batch_id} (interval={interval_seconds}s)")
        return {"status": "started", "batchId": batch_id, "interval": interval_seconds}

    async def stop_ticker(self):
        if not self._ticker_running:
            return {"status": "not_running"}
        self._ticker_running = False
        if self._ticker_task:
            self._ticker_task.cancel()
            try:
                await self._ticker_task
            except asyncio.CancelledError:
                pass
            self._ticker_task = None
        logger.info("Stopped telemetry simulator ticker.")
        return {"status": "stopped"}

    async def _run_ticker(self, interval_seconds: float):
        try:
            while self._ticker_running:
                await asyncio.sleep(interval_seconds)
                try:
                    await self.step_batch_simulation(
                        batch_id=self._active_batch_id,
                        scenario=self.current_scenario
                    )
                except Exception as e:
                    logger.warning(f"Ticker simulation step error: {e}")
        except asyncio.CancelledError:
            pass

    async def process_telemetry_reading(
        self,
        batch_id: str,
        temperature: float,
        humidity: float,
        voc: float,
        timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Direct ingestion pipeline for external or mock sensors:
        Saves reading, passes to XGBoost model, recomputes RSL + SLI + Risk,
        evaluates routing feasibility, checks for alerts, and broadcasts via WebSocket.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM batches WHERE id = ?", (batch_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Batch {batch_id} not found in database")

        base_temp = float(row["baseline_temp"])
        base_voc = float(row["baseline_voc"])
        init_rsl_hours = float(row["initial_shelf_life_hours"])
        init_rsl_days = max(0.1, init_rsl_hours / 24.0)

        # Estimate storage age in days from harvest_date or arrival_date
        storage_age_days = 2.0
        try:
            if row["harvest_date"]:
                h_date = datetime.strptime(row["harvest_date"][:10], "%Y-%m-%d")
                storage_age_days = max(0.5, (datetime.utcnow() - h_date).days + 0.5)
        except Exception:
            storage_age_days = 2.0

        current_route = json.loads(row["current_route"]) if row["current_route"] else {}
        recommended_action = json.loads(row["recommended_action"]) if row["recommended_action"] else {}

        # 1. XGBoost AI Prediction Pipeline
        try:
            pred_days, age_ratio = model_loader.predict_shelf_life(
                produce_type=row["produce"],
                temperature=temperature,
                humidity=humidity,
                voc=voc,
                storage_age=storage_age_days,
                initial_shelf_life=init_rsl_days
            )
            pred_hours = round(pred_days * 24.0, 1)
        except Exception as e:
            logger.error(f"XGBoost inference error: {e}")
            pred_days = init_rsl_days * 0.5
            pred_hours = round(pred_days * 24.0, 1)
            age_ratio = 0.5

        # 2. SLI & Risk Assessment
        sli = calculate_sli(remaining_shelf_life=pred_hours, initial_shelf_life=init_rsl_hours)
        risk_level = derive_risk_level(sli=sli, remaining_hours=pred_hours)
        explain_data = calculate_explainability(
            temperature=temperature,
            voc=voc,
            baseline_temp=base_temp,
            baseline_voc=base_voc
        )
        _, conf_score = calculate_prototype_confidence(sli=sli)

        # 3. Route Feasibility Evaluation
        transit_hours = float(current_route.get("transitDurationHours", 20.0))
        buffer_hours = round(pred_hours - transit_hours, 1)
        is_feasible = buffer_hours >= 4.0  # safe arrival buffer
        current_route["isFeasible"] = is_feasible

        # If route becomes infeasible, search best alternative
        if not is_feasible and recommended_action.get("status") in ("PENDING_APPROVAL", None, ""):
            best_alt = routing_service.find_best_alternative({
                "produce": row["produce"],
                "weightKg": row["weight_kg"],
                "remainingShelfLifeHours": pred_hours,
                "estimatedValue": row["estimated_value"]
            })
            recommended_action["actionType"] = "REROUTE_TO_PROCESSOR"
            recommended_action["urgency"] = "IMMEDIATE" if pred_hours < 24 else "HIGH"
            recommended_action["targetDestinationId"] = best_alt.get("targetDestinationId")
            recommended_action["title"] = f"Reroute to {best_alt.get('targetDestinationName')}"
            recommended_action["reason"] = best_alt.get("reason")
            recommended_action["economicRecoveryEst"] = best_alt.get("economicRecoveryEst")
            recommended_action["wasteAvoidedKg"] = row["weight_kg"]
            recommended_action["status"] = "PENDING_APPROVAL"
        elif is_feasible and recommended_action.get("actionType") == "REROUTE_TO_PROCESSOR" and recommended_action.get("status") == "PENDING_APPROVAL":
            # If conditions recovered back to safe, restore planned route
            recommended_action["actionType"] = "PROCEED_AS_PLANNED"
            recommended_action["urgency"] = "LOW"
            recommended_action["title"] = "Standard Route Safe & Approved"
            recommended_action["reason"] = f"Environment stabilized at {temperature}°C. Shelf-life buffer ({buffer_hours}h) intact."

        # 4. Save new telemetry point in SQLite
        now_iso = timestamp or (datetime.utcnow().isoformat() + "Z")
        now_time = datetime.utcnow().strftime("%H:%M:%S")
        cursor.execute("""
        INSERT INTO telemetry_readings (
            batch_id, timestamp, time_label, temperature, optimal_temp, max_threshold,
            humidity, optimal_humidity, voc, voc_threshold, sli, decay_acceleration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            batch_id, now_iso, now_time, temperature, base_temp, base_temp + 2.0,
            humidity, 88.0, voc, 2.0, sli, explain_data["decay_rate_factor"]
        ))

        # 5. Update Batch Record
        cursor.execute("""
        UPDATE batches SET
            current_temp = ?,
            current_humidity = ?,
            current_voc = ?,
            sli = ?,
            remaining_shelf_life_hours = ?,
            risk_level = ?,
            confidence_score = ?,
            decay_rate_factor = ?,
            current_route = ?,
            recommended_action = ?
        WHERE id = ?
        """, (
            temperature, humidity, voc, sli, pred_hours, risk_level,
            conf_score, explain_data["decay_rate_factor"],
            json.dumps(current_route), json.dumps(recommended_action),
            batch_id
        ))

        conn.commit()
        conn.close()

        # 6. Critical Alert Generation (safe after database connection closed)
        if risk_level == "CRITICAL":

            alert_service.create_alert(
                batch_id=batch_id,
                produce=row["produce"],
                severity="CRITICAL",
                title=f"🚨 Critical Degradation Alert for {batch_id}",
                message=(
                    f"Sensor reported {temperature}°C and {voc} ppm VOC. "
                    f"Predicted shelf-life collapsed to {pred_hours}h (SLI {sli}%). "
                    f"Route transit ({transit_hours}h) exceeds remaining shelf life."
                ),
                action_required=f"Review and approve reroute to {recommended_action.get('title', 'partner processor')}."
            )


        update_payload = {
            "type": "TELEMETRY_UPDATE",
            "scenario": self.current_scenario,
            "batchId": batch_id,
            "produce": row["produce"],
            "temperature": round(temperature, 1),
            "humidity": round(humidity, 1),
            "voc": round(voc, 2),
            "timestamp": now_iso,
            "time": now_time,
            "sli": sli,
            "remainingShelfLifeDays": round(pred_days, 2),
            "remainingShelfLifeHours": pred_hours,
            "initialShelfLifeHours": init_rsl_hours,
            "riskLevel": risk_level,
            "confidenceScore": conf_score,
            "isRouteFeasible": is_feasible,
            "recommendedAction": recommended_action,
            "explainability": explain_data,
            "disclaimer": HONESTY_DISCLAIMER
        }

        # Broadcast real-time message to all active WebSocket clients
        await ws_manager.broadcast(update_payload)
        return update_payload

    async def step_batch_simulation(
        self,
        batch_id: str = "BAT-9042",
        scenario: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Simulates environmental dynamics based on active scenario:
        NORMAL: slight nominal fluctuation
        STRESS: rapid heating and VOC accumulation
        RECOVERY: rapid cooling and VOC dissipation
        """
        active_scenario = scenario.upper() if scenario else self.current_scenario
        self.current_scenario = active_scenario

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM batches WHERE id = ?", (batch_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            # Fallback to first available batch if given batch not found
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM batches LIMIT 1")
            first = cursor.fetchone()
            conn.close()
            if first:
                batch_id = first["id"]
            else:
                raise ValueError("No produce batches exist in database.")

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM batches WHERE id = ?", (batch_id,))
        row = cursor.fetchone()
        conn.close()

        curr_temp = float(row["current_temp"])
        base_temp = float(row["baseline_temp"])
        curr_humidity = float(row["current_humidity"])
        curr_voc = float(row["current_voc"])
        base_voc = float(row["baseline_voc"])
        produce = row["produce"].lower()

        is_warm_crop = "tomato" in produce or base_temp >= 10.0

        if active_scenario == "STRESS":
            if is_warm_crop:
                # Target: 25°C -> 30°C, VOC: 3.2 -> 6.0 ppm
                target_max_temp = 30.2
                target_max_voc = 6.2
                new_temp = round(min(target_max_temp, max(curr_temp + random.uniform(1.2, 2.5), 25.0)), 1)
                new_voc = round(min(target_max_voc, max(curr_voc + random.uniform(0.8, 1.5), 3.2)), 1)
                new_humidity = round(max(75, min(88, curr_humidity - random.uniform(1.0, 3.0))))
            else:
                # Cold crop: Target 7.5°C -> 8.5°C, VOC: 6.8 ppm
                target_max_temp = 8.5
                target_max_voc = 7.2
                new_temp = round(min(target_max_temp, max(curr_temp + random.uniform(0.8, 1.6), 5.5)), 1)
                new_voc = round(min(target_max_voc, max(curr_voc + random.uniform(0.7, 1.4), 4.5)), 1)
                new_humidity = round(max(80, min(95, curr_humidity + random.uniform(-2, 2))))
        elif active_scenario == "RECOVERY":
            if is_warm_crop:
                # Target cool down: 30°C -> 25°C -> 18°C, VOC 6.0 -> 2.0 -> 0.8 ppm
                new_temp = round(max(base_temp, curr_temp - random.uniform(1.5, 2.8)), 1)
                new_voc = round(max(base_voc, curr_voc - random.uniform(0.8, 1.4)), 1)
                new_humidity = round(max(84, min(90, curr_humidity + random.uniform(0.5, 1.5))))
            else:
                new_temp = round(max(base_temp, curr_temp - random.uniform(0.8, 1.4)), 1)
                new_voc = round(max(base_voc, curr_voc - random.uniform(0.6, 1.1)), 1)
                new_humidity = round(max(88, min(94, curr_humidity + random.uniform(0.5, 1.5))))
        else: # NORMAL
            if is_warm_crop:
                new_temp = round(base_temp + random.uniform(-0.3, 0.4), 1)
                new_voc = round(base_voc + random.uniform(-0.1, 0.15), 1)
                new_humidity = round(max(84, min(89, curr_humidity + random.uniform(-1, 1))))
            else:
                new_temp = round(base_temp + random.uniform(-0.2, 0.3), 1)
                new_voc = round(base_voc + random.uniform(-0.1, 0.15), 1)
                new_humidity = round(max(88, min(94, curr_humidity + random.uniform(-1, 1))))

        return await self.process_telemetry_reading(
            batch_id=batch_id,
            temperature=new_temp,
            humidity=new_humidity,
            voc=new_voc
        )

telemetry_simulator = TelemetrySimulator()
