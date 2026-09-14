import os
from pathlib import Path
from typing import List

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

def get_model_path() -> Path:
    candidates = [
        MODEL_DIR / "ripepulse_model.pkl",
        BASE_DIR / "ripepulse_xgboost.pkl",
        MODEL_DIR / "ripepulse_xgboost.pkl",
        MODEL_DIR / "ripepulse_xgboost_orig.pkl"
    ]
    for c in candidates:
        if c.exists():
            return c
    return MODEL_DIR / "ripepulse_model.pkl"

DEFAULT_MODEL_PATH = get_model_path()

# Server Configuration
API_PREFIX = "/api"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

# Biological & Risk Thresholds
SLI_CRITICAL_THRESHOLD = 35.0   # SLI < 35% is CRITICAL
SLI_HIGH_THRESHOLD = 60.0       # SLI < 60% is HIGH
SLI_MEDIUM_THRESHOLD = 80.0     # SLI < 80% is MEDIUM

RSL_CRITICAL_HOURS = 24.0       # Remaining shelf-life < 24h is CRITICAL
RSL_HIGH_HOURS = 48.0           # Remaining shelf-life < 48h is HIGH

MIN_TRANSIT_BUFFER_HOURS = 8.0  # Buffer upon arrival required for feasibility
TEMP_WARNING_DELTA = 2.0        # Temp delta above baseline triggering warning
VOC_CRITICAL_PPM = 2.0          # VOC/Ethylene proxy threshold

# Research-informed Produce Types from Trained Model
SUPPORTED_PRODUCE_TYPES = [
    "Apple", "Banana", "Bell Pepper", "Broccoli", "Carrot",
    "Cucumber", "Grapes", "Mango", "Onion", "Onion_Green",
    "Orange", "Potato", "Spinach", "Strawberry", "Tomato"
]

# Baseline optimal storage temperatures (°C) per produce type
PRODUCE_OPTIMAL_BASELINES = {
    "Strawberry": 2.0,
    "Tomato": 15.0,
    "Spinach": 2.0,
    "Apple": 2.0,
    "Banana": 13.5,
    "Broccoli": 1.0,
    "Carrot": 1.0,
    "Cucumber": 10.0,
    "Grapes": 1.0,
    "Mango": 12.0,
    "Onion": 1.0,
    "Orange": 5.0,
    "Potato": 10.0,
    "Bell Pepper": 7.5
}


# Frontend Marketing Name to Model Classification Mapping
PRODUCE_NAME_ALIASES = {
    "organic strawberries": "Strawberry",
    "strawberries": "Strawberry",
    "strawberry": "Strawberry",
    "roma tomatoes": "Tomato",
    "tomatoes": "Tomato",
    "tomato": "Tomato",
    "baby spinach & arugula": "Spinach",
    "baby spinach": "Spinach",
    "spinach": "Spinach",
    "honeycrisp apples": "Apple",
    "apples": "Apple",
    "apple": "Apple",
    "hass avocados": "Tomato",  # Fallback to similar respiration curve if outside dataset
    "avocados": "Tomato",
    "avocado": "Tomato",
    "valencia oranges": "Orange",
    "oranges": "Orange",
    "orange": "Orange",
    "blackberries": "Strawberry",
    "broccoli": "Broccoli",
    "carrots": "Carrot",
    "carrot": "Carrot",
    "bell peppers": "Bell Pepper",
    "bell pepper": "Bell Pepper",
    "peppers": "Bell Pepper",
    "bananas": "Banana",
    "banana": "Banana",
    "grapes": "Grapes",
    "grape": "Grapes",
    "mango": "Mango",
    "mangoes": "Mango"
}

# Project Honesty Statement
HONESTY_DISCLAIMER = (
    "The prototype uses simulated and research-informed telemetry data. "
    "Real-world deployment would require real historical produce-quality datasets, "
    "calibrated sensors and field validation."
)
