import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

try:
    from services.receipt_service import receipt_service
    from auth_middleware import RoleChecker, get_current_actor
except ImportError:
    from backend.services.receipt_service import receipt_service
    from backend.auth_middleware import RoleChecker, get_current_actor

logger = logging.getLogger("ripepulse.routes.receipts")
router = APIRouter(prefix="/receiver", tags=["Destination Receiver Intake"])

# Role checker allowing DESTINATION_RECEIVER or ADMIN
receiver_role_guard = RoleChecker(["DESTINATION_RECEIVER", "ADMIN"])

class ReceiptVerificationRequest(BaseModel):
    sentWeightKg: float = Field(..., description="Original sent weight in kg")
    receivedWeightKg: float = Field(..., description="Actual quantity received in kg")
    damagedWeightKg: float = Field(0.0, description="Damaged quantity in kg")
    productCondition: str = Field("Good", description="Product condition: Good, Partially Damaged, Severely Damaged")
    verificationNotes: Optional[str] = Field(None, description="Notes / rejection reason")
    verifiedBy: Optional[str] = Field("Rajesh Sharma", description="Name of receiver staff")
    facilityName: Optional[str] = Field(None, description="Receiving facility name")
    explicitReject: bool = Field(False, description="Flag if receiver manually clicked Reject")

@router.get("/shipments")
def get_receiver_shipments(
    facility: Optional[str] = Query(None),
    role: str = Depends(receiver_role_guard)
):
    """
    Retrieves all incoming dispatches and summary metrics for the destination receiver portal.
    Restricted to DESTINATION_RECEIVER and ADMIN roles.
    """
    try:
        return receipt_service.get_receiver_shipments(facility_name=facility)
    except Exception as e:
        logger.error(f"Error fetching receiver shipments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shipments/{shipment_id}")
def get_receiver_shipment(
    shipment_id: str,
    role: str = Depends(receiver_role_guard)
):
    """Retrieves single shipment verification details by ID."""
    shipment = receipt_service.get_shipment_by_id(shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found.")
    return shipment

@router.post("/shipments/{shipment_id}/verify")
def verify_receiver_shipment(
    shipment_id: str,
    payload: ReceiptVerificationRequest,
    actor: Dict[str, str] = Depends(get_current_actor),
    role: str = Depends(receiver_role_guard)
):
    """
    Submits digital receipt verification for incoming produce shipment.
    Executes full validations, determines status (ACCEPTED, PARTIALLY_ACCEPTED, REJECTED),
    updates dispatches & batch inventory, adds on-hand destination stock, and locks verification receipt.
    """
    try:
        verified_name = actor.get("name") if actor.get("name") != "System Operator" else (payload.verifiedBy or "Rajesh Sharma")
        return receipt_service.verify_receipt(
            shipment_id=shipment_id,
            sent_weight_kg=payload.sentWeightKg,
            received_weight_kg=payload.receivedWeightKg,
            damaged_weight_kg=payload.damagedWeightKg,
            product_condition=payload.productCondition,
            verification_notes=payload.verificationNotes,
            verified_by=verified_name,
            facility_name=payload.facilityName,
            explicit_reject=payload.explicitReject,
            actor_role=actor.get("role", "DESTINATION_RECEIVER")
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to verify receipt for shipment {shipment_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal verification error: {str(e)}")

@router.get("/inventory")
def get_receiver_inventory(
    facility: Optional[str] = Query(None),
    role: str = Depends(receiver_role_guard)
):
    """Retrieves on-hand verified inventory at destination facilities."""
    try:
        items = receipt_service.get_destination_inventory(facility_name=facility)
        return {"success": True, "inventory": items}
    except Exception as e:
        logger.error(f"Error fetching receiver inventory: {e}")
        raise HTTPException(status_code=500, detail=str(e))
