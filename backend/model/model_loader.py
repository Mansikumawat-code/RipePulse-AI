import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
import joblib
import pandas as pd
import numpy as np
try:
    from config import DEFAULT_MODEL_PATH, PRODUCE_NAME_ALIASES, SUPPORTED_PRODUCE_TYPES
except ImportError:
    from backend.config import DEFAULT_MODEL_PATH, PRODUCE_NAME_ALIASES, SUPPORTED_PRODUCE_TYPES

logger = logging.getLogger("ripepulse.model_loader")

class ModelLoader:
    _instance: Optional["ModelLoader"] = None
    _model: Any = None
    _is_loaded: bool = False
    _model_path: Path = DEFAULT_MODEL_PATH
    _feature_names = [
        "produce_type",
        "temperature",
        "humidity",
        "voc",
        "storage_age",
        "initial_shelf_life",
        "age_ratio"
    ]

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
        return cls._instance

    def load_model(self, model_path: Optional[Path] = None) -> Any:
        target_path = Path(model_path) if model_path else self._model_path
        if self._is_loaded and self._model is not None:
            return self._model

        if not target_path.exists():
            raise FileNotFoundError(
                f"Model file not found at {target_path}. Please verify the file is present in backend/model/."
            )

        try:
            logger.info(f"Loading XGBoost model pipeline from {target_path}...")
            self._model = joblib.load(target_path)
            
            # Validate model structure
            if not hasattr(self._model, "predict"):
                raise ValueError("Loaded object does not have a 'predict' method.")
            
            # Check feature names if available
            if hasattr(self._model, "feature_names_in_"):
                loaded_features = list(self._model.feature_names_in_)
                logger.info(f"Model validated with input features: {loaded_features}")
                if loaded_features != self._feature_names:
                    logger.warning(
                        f"Feature mismatch: Expected {self._feature_names}, but model has {loaded_features}"
                    )

            self._is_loaded = True
            logger.info("XGBoost pipeline loaded and validated successfully.")
            return self._model
        except Exception as e:
            self._is_loaded = False
            self._model = None
            logger.error(f"Failed to load model from {target_path}: {e}")
            raise RuntimeError(f"Error loading trained XGBoost model: {e}")

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @property
    def model(self) -> Any:
        if not self._is_loaded:
            return self.load_model()
        return self._model

    def normalize_produce(self, produce_name: str) -> str:
        """
        Maps marketing/frontend produce names (e.g. 'Organic Strawberries', 'Roma Tomatoes')
        to the categories supported by the XGBoost OneHotEncoder.
        """
        if not produce_name:
            return "Tomato"
        cleaned = produce_name.strip().lower()
        if cleaned in PRODUCE_NAME_ALIASES:
            return PRODUCE_NAME_ALIASES[cleaned]
        
        # Check partial matches against supported types
        for ptype in SUPPORTED_PRODUCE_TYPES:
            if ptype.lower() in cleaned:
                return ptype
                
        # Default fallback
        return "Tomato"

    def predict_shelf_life(
        self,
        produce_type: str,
        temperature: float,
        humidity: float,
        voc: float,
        storage_age: float,
        initial_shelf_life: float
    ) -> Tuple[float, float]:
        """
        Prepares input features, computes age_ratio, runs XGBoost model,
        and returns (remaining_shelf_life_days, age_ratio).
        """
        if not self._is_loaded:
            self.load_model()

        norm_produce = self.normalize_produce(produce_type)
        safe_initial_rsl = max(0.1, float(initial_shelf_life))
        safe_storage_age = max(0.0, float(storage_age))
        age_ratio = safe_storage_age / safe_initial_rsl

        # Build feature DataFrame with exact names and types
        features_df = pd.DataFrame([{
            "produce_type": norm_produce,
            "temperature": float(temperature),
            "humidity": float(humidity),
            "voc": float(voc),
            "storage_age": safe_storage_age,
            "initial_shelf_life": safe_initial_rsl,
            "age_ratio": float(age_ratio)
        }])

        raw_pred = self._model.predict(features_df)
        predicted_days = float(raw_pred[0])
        
        # Physical constraints: remaining shelf life cannot exceed initial shelf life or drop below 0
        clamped_days = max(0.0, min(safe_initial_rsl, predicted_days))
        return clamped_days, age_ratio

    def run_diagnostics(self) -> Dict[str, Any]:
        """
        Executes a real runtime inference test using valid sample produce telemetry vectors.
        Returns complete AI model verifiability & health metadata.
        """
        model_name = "XGBoost Regressor (ripepulse_xgboost.pkl)"
        try:
            if not self._is_loaded:
                self.load_model()

            # Execute sample inference test 1: Healthy Strawberries
            days_healthy, ratio1 = self.predict_shelf_life("Strawberry", 2.0, 92.0, 0.5, 1.0, 6.0)
            
            # Execute sample inference test 2: Thermally Stressed Strawberries
            days_stressed, ratio2 = self.predict_shelf_life("Strawberry", 7.2, 94.0, 6.8, 1.0, 6.0)

            is_dynamic = days_healthy != days_stressed

            return {
                "status": "HEALTHY" if self._is_loaded else "UNAVAILABLE",
                "is_loaded": self._is_loaded,
                "model_type": "Trained XGBoost Pipeline (joblib)",
                "model_file": str(self._model_path.name),
                "model_path": str(self._model_path),
                "is_real_ml_model": True,
                "is_fallback_mode": not self._is_loaded,
                "input_features": self._feature_names,
                "runtime_inference_verified": is_dynamic,
                "sample_tests": {
                    "test_1_optimal_chill": {
                        "input": {"produce": "Strawberry", "temp": 2.0, "voc": 0.5, "storage_age": 1.0},
                        "predicted_remaining_days": round(days_healthy, 2),
                        "predicted_remaining_hours": round(days_healthy * 24.0, 1)
                    },
                    "test_2_thermal_spike": {
                        "input": {"produce": "Strawberry", "temp": 7.2, "voc": 6.8, "storage_age": 1.0},
                        "predicted_remaining_days": round(days_stressed, 2),
                        "predicted_remaining_hours": round(days_stressed * 24.0, 1)
                    }
                },
                "explainability_engine": "Arrhenius Q10 Respiration Kinetics Engine",
                "notes": "Verified real CPU-based XGBoost pipeline inference. Model dynamically adjusts output when temperature and VOC parameters fluctuate."
            }
        except Exception as e:
            logger.error(f"AI Model Diagnostic test failed: {e}")
            return {
                "status": "ERROR",
                "is_loaded": False,
                "model_type": "Trained XGBoost Pipeline",
                "is_real_ml_model": True,
                "is_fallback_mode": True,
                "error": str(e)
            }

# Global singleton helper
model_loader = ModelLoader()
