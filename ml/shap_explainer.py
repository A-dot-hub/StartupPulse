import pandas as pd
import numpy as np
import joblib
import shap
from pathlib import Path
from typing import Dict, Any, List, Optional

# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "ml" / "models" / "startup_model.pkl"
SHAP_DIR = BASE_DIR / "ml" / "models" / "shap"
GLOBAL_IMPORTANCE_PATH = SHAP_DIR / "feature_importance.csv"

# ============================================================
# GLOBAL CACHE (LOADED ONCE AT RUNTIME)
# ============================================================

_cached_pipeline = None
_cached_preprocessor = None
_cached_xgb_model = None
_cached_explainer = None
_cached_feature_names = None
_cached_global_importance = None


def load_shap_artifacts():
    """
    Load model pipeline and initialize SHAP TreeExplainer once.
    Reuses cached instances across all subsequent prediction/explanation requests.
    """
    global _cached_pipeline, _cached_preprocessor, _cached_xgb_model
    global _cached_explainer, _cached_feature_names

    if _cached_explainer is not None:
        return _cached_preprocessor, _cached_xgb_model, _cached_explainer, _cached_feature_names

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Trained startup model not found at {MODEL_PATH}")

    # Load trained scikit-learn Pipeline
    _cached_pipeline = joblib.load(MODEL_PATH)
    _cached_preprocessor = _cached_pipeline.named_steps["preprocessor"]
    _cached_xgb_model = _cached_pipeline.named_steps["model"]

    # Extract transformed feature names
    _cached_feature_names = _cached_preprocessor.get_feature_names_out()

    # Initialize SHAP TreeExplainer on the underlying XGBoost model
    _cached_explainer = shap.TreeExplainer(_cached_xgb_model)

    print("SHAP TreeExplainer initialized successfully and cached in memory.")
    return _cached_preprocessor, _cached_xgb_model, _cached_explainer, _cached_feature_names


# ============================================================
# FEATURE NAME CLEANING UTILITIES
# ============================================================

NUMERICAL_LABELS = {
    "funding_total_usd": "Funding Total",
    "startup_age": "Startup Age",
    "funding_rounds": "Funding Rounds",
    "years_to_first_funding": "Years to First Funding",
    "funding_per_round": "Funding Per Round",
}

CATEGORICAL_PREFIXES = [
    ("primary_category_", "Category: "),
    ("country_code_", "Country: "),
    ("state_code_", "State: "),
    ("region_", "Region: "),
    ("city_", "City: "),
]


def clean_feature_name(raw_name: str) -> str:
    """
    Transform raw scikit-learn pipeline feature names into readable UI labels.
    Examples:
        numerical__funding_total_usd -> Funding Total
        categorical__country_code_USA -> Country: USA
        categorical__primary_category_Software -> Category: Software
    """
    name = str(raw_name)

    if name.startswith("numerical__"):
        col = name[len("numerical__"):]
        return NUMERICAL_LABELS.get(col, col.replace("_", " ").title())

    if name.startswith("categorical__"):
        col_and_val = name[len("categorical__"):]
        for prefix, label in CATEGORICAL_PREFIXES:
            if col_and_val.startswith(prefix):
                val = col_and_val[len(prefix):]
                return f"{label}{val}"
        # Fallback if unknown categorical prefix
        parts = col_and_val.split("_", 1)
        if len(parts) == 2:
            return f"{parts[0].replace('_', ' ').title()}: {parts[1]}"
        return col_and_val.replace("_", " ").title()

    if name.startswith("remainder__"):
        clean = name[len("remainder__"):]
        return clean.replace("_", " ").title()

    return name.replace("_", " ").title()


def get_feature_input_value(raw_name: str, startup_dict: Dict[str, Any]) -> Any:
    """
    Retrieve the corresponding user input value for a given transformed feature.
    """
    name = str(raw_name)

    if name.startswith("numerical__"):
        col = name[len("numerical__"):]
        val = startup_dict.get(col)
        if val is not None:
            try:
                return float(val) if "." in str(val) else int(val)
            except (ValueError, TypeError):
                return val
        return 0

    if name.startswith("categorical__"):
        col_and_val = name[len("categorical__"):]
        for prefix, _ in CATEGORICAL_PREFIXES:
            if col_and_val.startswith(prefix):
                target_val = col_and_val[len(prefix):]
                col = prefix.rstrip("_")
                user_val = startup_dict.get(col, "Unknown")
                # Return the matching category string or user's value
                return str(user_val)

    return startup_dict.get(name, "N/A")


# ============================================================
# INDIVIDUAL STARTUP EXPLANATION
# ============================================================

def explain_startup_prediction(
    primary_category: str,
    funding_total_usd: float,
    country_code: str,
    state_code: str,
    region: str,
    city: str,
    funding_rounds: int,
    startup_age: float,
    years_to_first_funding: float,
    funding_per_round: float,
    top_n: int = 5
) -> Dict[str, Any]:
    """
    Compute individual SHAP feature contributions for a specific startup.

    Returns:
    {
        "base_value": float,
        "prediction_value": float,
        "positive_factors": [
            {"feature": str, "value": Any, "impact": float}
        ],
        "negative_factors": [
            {"feature": str, "value": Any, "impact": float}
        ]
    }
    """
    preprocessor, xgb_model, explainer, feature_names = load_shap_artifacts()

    # 1. Format raw startup data frame matching the trained model pipeline
    startup_dict = {
        "primary_category": str(primary_category).strip() or "Unknown",
        "funding_total_usd": float(funding_total_usd or 0),
        "country_code": str(country_code).strip() or "Unknown",
        "state_code": str(state_code).strip() or "Unknown",
        "region": str(region).strip() or "Unknown",
        "city": str(city).strip() or "Unknown",
        "funding_rounds": int(max(1, funding_rounds or 1)),
        "startup_age": float(max(0, startup_age or 0)),
        "years_to_first_funding": float(max(0, years_to_first_funding or 0)),
        "funding_per_round": float(max(0, funding_per_round or 0))
    }

    startup_df = pd.DataFrame([startup_dict])

    # Clean categorical values
    categorical_columns = ["primary_category", "country_code", "state_code", "region", "city"]
    for column in categorical_columns:
        startup_df[column] = startup_df[column].fillna("Unknown").astype(str).str.strip()
        startup_df[column] = startup_df[column].replace("", "Unknown")

    # Clean numerical values
    numerical_columns = [
        "funding_total_usd",
        "funding_rounds",
        "startup_age",
        "years_to_first_funding",
        "funding_per_round"
    ]
    for column in numerical_columns:
        startup_df[column] = pd.to_numeric(startup_df[column], errors="coerce")
    startup_df[numerical_columns] = startup_df[numerical_columns].fillna(0)

    # 2. Transform startup using the trained pipeline's preprocessor
    startup_transformed = preprocessor.transform(startup_df)

    # 3. Calculate SHAP values
    shap_output = explainer.shap_values(startup_transformed)

    # Handle binary classification output formats from shap
    if isinstance(shap_output, list) and len(shap_output) >= 2:
        # Class 1 (Successful Outcome)
        sample_shap = shap_output[1][0]
    elif isinstance(shap_output, list) and len(shap_output) == 1:
        sample_shap = shap_output[0][0]
    else:
        sample_shap = shap_output[0] if getattr(shap_output, "ndim", 1) == 2 else shap_output

    # 4. Extract base value and prediction value
    expected_val = explainer.expected_value
    if isinstance(expected_val, (list, np.ndarray)):
        base_value = float(expected_val[1] if len(expected_val) >= 2 else expected_val[0])
    else:
        base_value = float(expected_val)

    # Total contribution sum
    total_shap_sum = float(np.sum(sample_shap))
    prediction_value = round(base_value + total_shap_sum, 4)

    # 5. Build contribution factors
    contributions = []
    for idx, raw_feat in enumerate(feature_names):
        shap_val = float(sample_shap[idx])
        clean_name = clean_feature_name(raw_feat)
        input_val = get_feature_input_value(raw_feat, startup_dict)

        contributions.append({
            "raw_feature": str(raw_feat),
            "feature": clean_name,
            "value": input_val,
            "impact": round(shap_val, 4),
            "abs_impact": abs(shap_val)
        })

    # Filter positive factors (pushing toward success)
    positive_candidates = [c for c in contributions if c["impact"] > 0]
    positive_candidates.sort(key=lambda x: x["impact"], reverse=True)

    # Filter negative factors (pushing toward failure)
    negative_candidates = [c for c in contributions if c["impact"] < 0]
    negative_candidates.sort(key=lambda x: x["abs_impact"], reverse=True)

    # Take top N
    top_positive = [
        {
            "feature": item["feature"],
            "value": item["value"],
            "impact": item["impact"]
        }
        for item in positive_candidates[:top_n]
    ]

    top_negative = [
        {
            "feature": item["feature"],
            "value": item["value"],
            "impact": item["impact"]
        }
        for item in negative_candidates[:top_n]
    ]

    return {
        "base_value": round(base_value, 4),
        "prediction_value": prediction_value,
        "positive_factors": top_positive,
        "negative_factors": top_negative
    }


# ============================================================
# GLOBAL FEATURE IMPORTANCE
# ============================================================

def get_global_feature_importance(top_n: int = 10) -> List[Dict[str, Any]]:
    """
    Load and clean global feature importance from ml/models/shap/feature_importance.csv.
    Used for general model explanations in the Dashboard.
    """
    global _cached_global_importance

    if _cached_global_importance is not None:
        return _cached_global_importance[:top_n]

    if not GLOBAL_IMPORTANCE_PATH.exists():
        return []

    try:
        df = pd.read_csv(GLOBAL_IMPORTANCE_PATH)
        cleaned_list = []

        seen_features = set()
        for _, row in df.iterrows():
            raw_feat = str(row["feature"])
            importance = float(row["mean_abs_shap"])
            clean_name = clean_feature_name(raw_feat)

            # Deduplicate similar feature buckets if needed
            if clean_name not in seen_features:
                seen_features.add(clean_name)
                cleaned_list.append({
                    "feature": clean_name,
                    "importance": round(importance, 4),
                    "raw_feature": raw_feat
                })

            if len(cleaned_list) >= 20:
                break

        _cached_global_importance = cleaned_list
        return _cached_global_importance[:top_n]

    except Exception as err:
        print(f"Error loading global feature importance: {err}")
        return []