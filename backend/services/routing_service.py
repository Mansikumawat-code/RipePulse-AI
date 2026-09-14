import json
import logging
from typing import Dict, Any, List, Optional
try:
    from database.db import get_db_connection
    from config import MIN_TRANSIT_BUFFER_HOURS
except ImportError:
    from backend.database.db import get_db_connection
    from backend.config import MIN_TRANSIT_BUFFER_HOURS

logger = logging.getLogger("ripepulse.routing_service")

class RoutingService:
    def get_all_destinations(self, batch_id: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM destinations ORDER BY distance_km ASC")
        rows = cursor.fetchall()
        conn.close()

        destinations = []
        for r in rows:
            coords = json.loads(r["coordinates"]) if r["coordinates"] else [22.7196, 75.8577]
            preferred = json.loads(r["preferred_produce"]) if r["preferred_produce"] else []
            rec_batches = json.loads(r["recommended_for_batches"]) if r["recommended_for_batches"] else []
            dest = {
                "id": r["id"],
                "name": r["name"],
                "type": r["type"],
                "icon": r["icon"],
                "category": r["category"],
                "location": r["location"],
                "distanceKm": r["distance_km"],
                "travelTimeMinutes": r["travel_time_minutes"],
                "coordinates": coords,
                "capacityAvailableKg": r["capacity_available_kg"],
                "preferredProduce": preferred,
                "pricingFactor": r["pricing_factor"],
                "contactPerson": r["contact_person"],
                "phone": r["phone"],
                "rating": r["rating"],
                "recommendedForBatches": rec_batches
            }
            if not batch_id or not rec_batches or batch_id in rec_batches:
                destinations.append(dest)
        return destinations

    def get_destination_by_id(self, dest_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM destinations WHERE id = ?", (dest_id,))
        r = cursor.fetchone()
        conn.close()
        if not r:
            return None
        return {
            "id": r["id"],
            "name": r["name"],
            "type": r["type"],
            "icon": r["icon"],
            "category": r["category"],
            "location": r["location"],
            "distanceKm": r["distance_km"],
            "travelTimeMinutes": r["travel_time_minutes"],
            "coordinates": json.loads(r["coordinates"]),
            "capacityAvailableKg": r["capacity_available_kg"],
            "preferredProduce": json.loads(r["preferred_produce"]),
            "pricingFactor": r["pricing_factor"],
            "contactPerson": r["contact_person"],
            "phone": r["phone"],
            "rating": r["rating"],
            "recommendedForBatches": json.loads(r["recommended_for_batches"]) if r["recommended_for_batches"] else []
        }

    def evaluate_route_feasibility(self, batch: Dict[str, Any], route: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates planned route transit duration against remaining shelf life.
        Buffer Hours = RSL (hours) - Transit (hours).
        Feasible only if Buffer >= MIN_TRANSIT_BUFFER_HOURS (8.0h).
        """
        remaining_hours = float(batch.get("remainingShelfLifeHours") or 24.0)
        transit_hours = float(route.get("transitDurationHours") or 12.0)
        buffer_hours = round(remaining_hours - transit_hours, 1)
        is_feasible = buffer_hours >= MIN_TRANSIT_BUFFER_HOURS

        urgency = "SAFE"
        if not is_feasible:
            urgency = "CRITICAL_SPOILAGE" if remaining_hours < transit_hours else "MARGINAL_FAILURE"

        feasibility_score = max(0, min(100, int((buffer_hours / max(1.0, remaining_hours)) * 100)))

        destination_name = route.get("destinationName", "Scheduled Destination")
        if is_feasible:
            recommendation = f"Route to {destination_name} is viable with {buffer_hours}h retail safety buffer."
        else:
            deficit = abs(buffer_hours)
            recommendation = (
                f"Route to {destination_name} is INFEASIBLE: requires {transit_hours}h transit, but batch has "
                f"only {remaining_hours}h shelf-life ({deficit}h buffer deficit). Immediate redistribution recommended."
            )

        return {
            "isFeasible": is_feasible,
            "transitHours": transit_hours,
            "remainingHours": remaining_hours,
            "bufferHours": buffer_hours,
            "urgency": urgency,
            "feasibilityScore": feasibility_score,
            "recommendation": recommendation
        }

    def find_best_alternative(self, batch: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates alternative destinations based on:
        1. Capacity >= batch weight
        2. Produce compatibility
        3. Travel time within remaining shelf life
        4. Maximized economic value recovery
        """
        destinations = self.get_all_destinations()
        weight_kg = float(batch.get("weightKg") or 2500.0)
        rsl_hours = float(batch.get("remainingShelfLifeHours") or 16.0)
        est_value = float(batch.get("estimatedValue") or 10000.0)
        produce = batch.get("produce", "").lower()

        candidates = []
        for d in destinations:
            # 1. Capacity check
            if d["capacityAvailableKg"] < weight_kg:
                continue

            # 2. Compatibility check
            preferred = [p.lower() for p in d["preferredProduce"]]
            is_compatible = any(p in produce or produce in p for p in preferred) or "all fresh produce" in preferred
            if not is_compatible:
                continue

            # 3. Travel time feasibility
            travel_hours = d["travelTimeMinutes"] / 60.0
            if travel_hours >= rsl_hours:
                continue

            # 4. Economic recovery
            salvage_val = round(d["pricingFactor"] * est_value)
            pct = int(d["pricingFactor"] * 100)

            candidates.append({
                "destination": d,
                "travelHours": travel_hours,
                "salvageValue": salvage_val,
                "recoveryPct": pct,
                # Score: higher recovery is good, lower travel time is good
                "score": salvage_val / max(0.2, travel_hours)
            })

        if not candidates:
            # Fallback to local food relief bank
            relief = [d for d in destinations if d["category"] == "FOOD_BANK"]
            target = relief[0] if relief else destinations[0]
            return {
                "targetDestinationId": target["id"],
                "targetDestinationName": target["name"],
                "travelTimeMinutes": target["travelTimeMinutes"],
                "economicRecoveryEst": "$0 (Tax deduction eligible)",
                "reason": "Emergency redistribution to Food Relief Bank to prevent total spoilage.",
                "wasteAvoidedKg": weight_kg
            }

        candidates.sort(key=lambda c: c["score"], reverse=True)
        best = candidates[0]
        dest = best["destination"]

        return {
            "targetDestinationId": dest["id"],
            "targetDestinationName": dest["name"],
            "travelTimeMinutes": dest["travelTimeMinutes"],
            "distanceKm": dest["distanceKm"],
            "economicRecoveryEst": f"${best['salvageValue']:,} ({best['recoveryPct']}%)",
            "wasteAvoidedKg": weight_kg,
            "reason": (
                f"Reroute to {dest['name']} preserves {best['recoveryPct']}% produce value (${best['salvageValue']:,}). "
                f"Travel time is only {dest['travelTimeMinutes']} mins ({dest['distanceKm']} km), easily fitting within "
                f"the {rsl_hours}h shelf-life window."
            )
        }

routing_service = RoutingService()
