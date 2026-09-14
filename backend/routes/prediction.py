import logging
from fastapi import APIRouter, HTTPException
try:
    from schemas.prediction import PredictionRequest, PredictionResponse, Explainability
    from model.model_loader import model_loader
    from services.risk_engine import (
        calculate_sli,
        derive_risk_level,
        calculate_explainability,
        calculate_prototype_confidence
    )
    from config import HONESTY_DISCLAIMER
except ImportError:
    from backend.schemas.prediction import PredictionRequest, PredictionResponse, Explainability
    from backend.model.model_loader import model_loader
    from backend.services.risk_engine import (
        calculate_sli,
        derive_risk_level,
        calculate_explainability,
        calculate_prototype_confidence
    )
    from backend.config import HONESTY_DISCLAIMER

logger = logging.getLogger("ripepulse.routes.prediction")
router = APIRouter(tags=["AI Prediction"])

@router.post("/predict", response_model=PredictionResponse)
def predict_shelf_life_endpoint(request: PredictionRequest):
    """
    Executes remaining shelf life prediction using the trained XGBoost model.
    Validates input features, derives age_ratio, computes SLI, and evaluates risk level.
    """
    try:
        # Preprocessing & Model Prediction
        rsl_days, age_ratio = model_loader.predict_shelf_life(
            produce_type=request.produce_type or "Tomato",
            temperature=request.temperature,
            humidity=request.humidity,
            voc=request.voc,
            storage_age=request.storage_age,
            initial_shelf_life=request.initial_shelf_life
        )

        rsl_hours = round(rsl_days * 24.0, 1)
        initial_hours = round(request.initial_shelf_life * 24.0, 1)

        # SLI & Risk Assessment
        sli = calculate_sli(remaining_shelf_life=rsl_days, initial_shelf_life=request.initial_shelf_life)
        risk_level = derive_risk_level(sli=sli, remaining_hours=rsl_hours)
        
        # Respiration Kinetics & Explainability
        baseline_temp = request.baselineTemp if request.baselineTemp is not None else 2.0
        explain_data = calculate_explainability(
            temperature=request.temperature,
            voc=request.voc,
            baseline_temp=baseline_temp
        )
        conf_label, conf_score = calculate_prototype_confidence(sli=sli)

        return PredictionResponse(
            batch_id=request.batch_id,
            produce_type=model_loader.normalize_produce(request.produce_type),
            remaining_shelf_life_days=round(rsl_days, 2),
            remaining_shelf_life_hours=rsl_hours,
            initial_shelf_life_days=round(request.initial_shelf_life, 2),
            initial_shelf_life_hours=initial_hours,
            storage_age_days=round(request.storage_age, 2),
            age_ratio=round(age_ratio, 3),
            sli=sli,
            risk_level=risk_level,
            confidence=conf_label,
            confidence_score=conf_score,
            decay_rate_factor=explain_data["decay_rate_factor"],
            explainability=Explainability(
                temp_impact=explain_data["temp_impact"],
                voc_impact=explain_data["voc_impact"],
                primary_driver=explain_data["primary_driver"]
            ),
            model_status="loaded" if model_loader.is_loaded else "unavailable",
            disclaimer=HONESTY_DISCLAIMER
        )
    except Exception as e:
        logger.error(f"Prediction execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/predict/diagnostics")
@router.get("/ai/health")
@router.get("/ai/diagnostics")
def get_ai_diagnostics_endpoint():
    """
    Mandatory AI functional audit & diagnostic endpoint.
    Executes live CPU-based XGBoost inference test and reports model health & dynamic verifiability.
    """
    return model_loader.run_diagnostics()
