from typing import Dict, Any, Tuple
try:
    from config import (
        SLI_CRITICAL_THRESHOLD,
        SLI_HIGH_THRESHOLD,
        SLI_MEDIUM_THRESHOLD,
        RSL_CRITICAL_HOURS,
        RSL_HIGH_HOURS,
        TEMP_WARNING_DELTA,
        VOC_CRITICAL_PPM
    )
except ImportError:
    from backend.config import (
        SLI_CRITICAL_THRESHOLD,
        SLI_HIGH_THRESHOLD,
        SLI_MEDIUM_THRESHOLD,
        RSL_CRITICAL_HOURS,
        RSL_HIGH_HOURS,
        TEMP_WARNING_DELTA,
        VOC_CRITICAL_PPM
    )

def calculate_sli(remaining_shelf_life: float, initial_shelf_life: float) -> float:
    """
    Computes Shelf-Life Index (SLI) as percentage of remaining shelf-life.
    Clamped strictly between 0.0 and 100.0.
    """
    if initial_shelf_life <= 0:
        return 0.0
    raw_sli = (remaining_shelf_life / initial_shelf_life) * 100.0
    return round(max(0.0, min(100.0, raw_sli)), 1)

def derive_risk_level(sli: float, remaining_hours: float) -> str:
    """
    Derives categorical risk state using centralized config thresholds.
    Risk levels: CRITICAL, HIGH, MEDIUM, LOW.
    """
    if sli < SLI_CRITICAL_THRESHOLD or remaining_hours < RSL_CRITICAL_HOURS:
        return "CRITICAL"
    if sli < SLI_HIGH_THRESHOLD or remaining_hours < RSL_HIGH_HOURS:
        return "HIGH"
    if sli < SLI_MEDIUM_THRESHOLD:
        return "MEDIUM"
    return "LOW"

def calculate_explainability(
    temperature: float,
    voc: float,
    baseline_temp: float = 2.0,
    baseline_voc: float = 0.5
) -> Dict[str, Any]:
    """
    Generates biological respiration kinetics explainability metrics.
    Uses Arrhenius Q10 approximation for temperature-induced respiration rate.
    """
    temp_diff = max(0.0, float(temperature) - float(baseline_temp))
    # Arrhenius Q10 ~ 2.5 for horticultural produce
    q10_factor = 2.5 ** (temp_diff / 10.0)
    voc_elevated = float(voc) > VOC_CRITICAL_PPM

    respiration_increase_pct = max(0, round((q10_factor - 1.0) * 100))
    temp_impact = (
        f"Temperature elevation (+{temp_diff:.1f}°C) accelerates respiration by {respiration_increase_pct}%"
        if temp_diff > 0.5 else "Temperature is within optimal cold-chain baseline"
    )

    voc_impact = (
        f"Elevated VOC/Ethylene ({voc:.1f} ppm > {VOC_CRITICAL_PPM} ppm threshold) accelerates ripening cascades"
        if voc_elevated else "VOC levels within nominal baseline"
    )

    if temp_diff > TEMP_WARNING_DELTA and voc_elevated:
        primary_driver = "Thermal Abuse & Ethylene Surge"
    elif temp_diff > TEMP_WARNING_DELTA:
        primary_driver = "Thermal Abuse"
    elif voc_elevated:
        primary_driver = "Ethylene Spurt"
    else:
        primary_driver = "Nominal Aging"

    decay_rate_factor = round(q10_factor * (1.4 if voc_elevated else 1.0), 2)

    return {
        "temp_impact": temp_impact,
        "voc_impact": voc_impact,
        "primary_driver": primary_driver,
        "decay_rate_factor": decay_rate_factor
    }

def calculate_prototype_confidence(sli: float) -> Tuple[str, float]:
    """
    Prototype heuristic confidence score. Clearly labeled to avoid claiming false scientific precision.
    """
    score = round(92.0 + (sli / 100.0) * 6.0, 1)
    label = f"{score:.1f}% (prototype heuristic)"
    return label, score
