from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator

class PredictionRequest(BaseModel):
    # Primary fields
    produce_type: Optional[str] = Field(None, description="Produce variety (e.g. Tomato, Strawberry, Spinach)")
    temperature: Optional[float] = Field(None, description="Current ambient/storage temperature in °C")
    humidity: Optional[float] = Field(None, description="Current relative humidity in %")
    voc: Optional[float] = Field(None, description="VOC / Ethylene proxy reading in ppm")
    storage_age: Optional[float] = Field(None, description="Elapsed storage age in days")
    initial_shelf_life: Optional[float] = Field(None, description="Initial total shelf life in days")
    
    # Frontend compatibility aliases
    batch_id: Optional[str] = Field(None, alias="id")
    produce: Optional[str] = None
    currentTemp: Optional[float] = None
    baselineTemp: Optional[float] = None
    currentHumidity: Optional[float] = None
    currentVoc: Optional[float] = None
    initialShelfLifeHours: Optional[float] = None
    remainingShelfLifeHours: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_frontend_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Resolve produce type
            if not data.get("produce_type"):
                data["produce_type"] = data.get("produce") or "Tomato"
            
            # Resolve temperature
            if data.get("temperature") is None:
                data["temperature"] = data.get("currentTemp") if data.get("currentTemp") is not None else 18.0

            # Resolve humidity
            if data.get("humidity") is None:
                data["humidity"] = data.get("currentHumidity") if data.get("currentHumidity") is not None else 85.0

            # Resolve VOC
            if data.get("voc") is None:
                data["voc"] = data.get("currentVoc") if data.get("currentVoc") is not None else 0.5

            # Resolve initial shelf life (convert hours to days if hours provided)
            if data.get("initial_shelf_life") is None:
                if data.get("initialShelfLifeHours") is not None:
                    data["initial_shelf_life"] = data["initialShelfLifeHours"] / 24.0
                else:
                    data["initial_shelf_life"] = 14.0  # default 14 days

            # Resolve storage age
            if data.get("storage_age") is None:
                if data.get("remainingShelfLifeHours") is not None and data.get("initialShelfLifeHours") is not None:
                    elapsed_hours = max(0.0, data["initialShelfLifeHours"] - data["remainingShelfLifeHours"])
                    data["storage_age"] = elapsed_hours / 24.0
                else:
                    data["storage_age"] = 1.0  # default 1 day

        return data


class Explainability(BaseModel):
    temp_impact: str
    voc_impact: str
    primary_driver: str


class PredictionResponse(BaseModel):
    batch_id: Optional[str] = None
    produce_type: str
    remaining_shelf_life_days: float
    remaining_shelf_life_hours: float
    initial_shelf_life_days: float
    initial_shelf_life_hours: float
    storage_age_days: float
    age_ratio: float
    sli: float
    risk_level: str
    confidence: str
    confidence_score: float
    decay_rate_factor: float
    explainability: Explainability
    model_status: str
    disclaimer: str
