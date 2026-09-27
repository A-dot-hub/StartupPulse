import pandas as pd
import numpy as np
from typing import Dict, Any, Union

# ============================================================
# CANONICAL FEATURE SPECIFICATION
# ============================================================
# Exactly 10 features expected by the trained XGBoost pipeline
CANONICAL_COLUMNS = [
    "primary_category",
    "funding_total_usd",
    "country_code",
    "state_code",
    "region",
    "city",
    "funding_rounds",
    "startup_age",
    "years_to_first_funding",
    "funding_per_round",
]

CATEGORICAL_COLUMNS = [
    "primary_category",
    "country_code",
    "state_code",
    "region",
    "city",
]

NUMERICAL_COLUMNS = [
    "funding_total_usd",
    "funding_rounds",
    "startup_age",
    "years_to_first_funding",
    "funding_per_round",
]


def normalize_startup_dict(raw_input: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
    """
    Produce a canonical, validated dictionary representing exactly one startup's attributes.
    Enforces the single source of truth across:
      1. XGBoost model prediction
      2. Probability & risk scoring
      3. SHAP TreeExplainer individual feature attribution
      4. MongoDB persistent storage
      5. Frontend display

    Enforces the canonical formula:
      funding_per_round = funding_total_usd / funding_rounds (when funding_rounds >= 1)
    Does not trust independently supplied, potentially inconsistent derived values.
    """
    if hasattr(raw_input, "model_dump"):
        # Pydantic v2
        data = raw_input.model_dump()
    elif hasattr(raw_input, "dict"):
        # Pydantic v1
        data = raw_input.dict()
    elif isinstance(raw_input, dict):
        data = dict(raw_input)
    else:
        raise TypeError(f"Unsupported startup input type: {type(raw_input)}")

    # 1. Clean categorical values
    primary_category = str(data.get("primary_category", "")).strip() or "Unknown"
    country_code = str(data.get("country_code", "")).strip() or "Unknown"
    state_code = str(data.get("state_code", "")).strip() or "Unknown"
    region = str(data.get("region", "")).strip() or "Unknown"
    city = str(data.get("city", "")).strip() or "Unknown"

    # 2. Clean numerical values
    try:
        funding_total_usd = float(data.get("funding_total_usd") if data.get("funding_total_usd") is not None else 0)
    except (ValueError, TypeError):
        funding_total_usd = 0.0
    funding_total_usd = max(0.0, funding_total_usd)

    try:
        funding_rounds = int(data.get("funding_rounds") if data.get("funding_rounds") is not None else 1)
    except (ValueError, TypeError):
        funding_rounds = 1
    funding_rounds = max(1, funding_rounds)

    try:
        startup_age = float(data.get("startup_age") if data.get("startup_age") is not None else 0)
    except (ValueError, TypeError):
        startup_age = 0.0
    startup_age = max(0.0, startup_age)

    try:
        years_to_first_funding = float(data.get("years_to_first_funding") if data.get("years_to_first_funding") is not None else 0)
    except (ValueError, TypeError):
        years_to_first_funding = 0.0
    years_to_first_funding = max(0.0, years_to_first_funding)

    # 3. Canonical calculation of funding_per_round
    # (single source of truth: total / rounds)
    calculated_funding_per_round = round(funding_total_usd / funding_rounds, 2)

    canonical_dict = {
        "primary_category": primary_category,
        "funding_total_usd": funding_total_usd,
        "country_code": country_code,
        "state_code": state_code,
        "region": region,
        "city": city,
        "funding_rounds": funding_rounds,
        "startup_age": startup_age,
        "years_to_first_funding": years_to_first_funding,
        "funding_per_round": calculated_funding_per_round,
    }

    return canonical_dict


def build_startup_dataframe(startup_input: Union[Dict[str, Any], Any]) -> pd.DataFrame:
    """
    Build exactly one canonical DataFrame with exactly the 10 features in required order.
    The exact same DataFrame is used for both prediction and SHAP explanation.
    """
    canonical_dict = normalize_startup_dict(startup_input)
    df = pd.DataFrame([canonical_dict], columns=CANONICAL_COLUMNS)
    return df
