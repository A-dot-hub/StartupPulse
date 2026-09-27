import pandas as pd
import numpy as np
import joblib
import shap
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from ml.input_utils import (
    CANONICAL_COLUMNS,
    build_startup_dataframe,
    normalize_startup_dict,
)

# ============================================================
# PATH CONFIGURATION
# ============================================================

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

    if not hasattr(_cached_pipeline, "named_steps"):
        raise TypeError("Loaded model does not have named_steps; expected Pipeline.")

    _cached_preprocessor = _cached_pipeline.named_steps["preprocessor"]
    _cached_xgb_model = _cached_pipeline.named_steps["model"]

    # Extract transformed feature names from the fitted preprocessor
    _cached_feature_names = list(_cached_preprocessor.get_feature_names_out())

    # Initialize SHAP TreeExplainer on the underlying XGBoost model
    _cached_explainer = shap.TreeExplainer(_cached_xgb_model)

    print(
        f"SHAP TreeExplainer initialized successfully with {len(_cached_feature_names)} features and cached in memory."
    )
    return _cached_preprocessor, _cached_xgb_model, _cached_explainer, _cached_feature_names


# ============================================================
# FEATURE NAME CLEANING & PARSING UTILITIES
# ============================================================

NUMERICAL_DISPLAY_MAP = {
    "funding_total_usd": "Funding Total",
    "startup_age": "Startup Age",
    "funding_rounds": "Funding Rounds",
    "years_to_first_funding": "Years to First Funding",
    "funding_per_round": "Funding Per Round",
}

CATEGORICAL_PREFIX_SPECS = [
    ("primary_category_", "primary_category", "Category: "),
    ("country_code_", "country_code", "Country: "),
    ("state_code_", "state_code", "State: "),
    ("region_", "region", "Region: "),
    ("city_", "city", "City: "),
]


def parse_transformed_feature(raw_feat_name: str) -> Tuple[str, str, str, bool]:
    """
    Parse a scikit-learn ColumnTransformer feature name (e.g.
    'categorical__country_code_SGP' or 'numerical__funding_total_usd').

    Returns a 4-tuple:
      (display_name, raw_feature, encoded_value, is_categorical)

    Examples:
      'numerical__funding_total_usd' -> ('Funding Total', 'funding_total_usd', '', False)
      'categorical__country_code_SGP' -> ('Country: SGP', 'country_code', 'SGP', True)
      'categorical__primary_category_FinTech' -> ('Category: FinTech', 'primary_category', 'FinTech', True)
      'categorical__region_SF Bay Area' -> ('Region: SF Bay Area', 'region', 'SF Bay Area', True)
    """
    name = str(raw_feat_name)

    if name.startswith("numerical__"):
        col = name[len("numerical__"):]
        display = NUMERICAL_DISPLAY_MAP.get(col, col.replace("_", " ").title())
        return display, col, "", False

    if name.startswith("categorical__"):
        sub = name[len("categorical__"):]
        for prefix, raw_col, label_prefix in CATEGORICAL_PREFIX_SPECS:
            if sub.startswith(prefix):
                cat_val = sub[len(prefix):]
                display = f"{label_prefix}{cat_val}"
                return display, raw_col, cat_val, True

        # Fallback if unfamiliar categorical prefix
        parts = sub.split("_", 1)
        if len(parts) == 2:
            return f"{parts[0].replace('_', ' ').title()}: {parts[1]}", parts[0], parts[1], True
        return sub.replace("_", " ").title(), sub, "", True

    if name.startswith("remainder__"):
        clean = name[len("remainder__"):]
        return clean.replace("_", " ").title(), clean, "", False

    return name.replace("_", " ").title(), name, "", False


# ============================================================
# INDIVIDUAL STARTUP EXPLANATION
# ============================================================

def explain_startup_prediction_from_df(
    startup_df: pd.DataFrame,
    top_n: int = 5
) -> Dict[str, Any]:
    """
    Compute individual SHAP feature contributions using the exact canonical startup DataFrame.

    Guarantees:
      1. Preprocessor transformation uses preprocessor.transform(canonical_df)
      2. Feature names from preprocessor.get_feature_names_out()
      3. Exact index-based mapping: feature_name[i] <-> shap_value[i]
      4. Length validation: len(feature_names) == transformed_data.shape[1] == len(shap_values)
      5. Only ACTIVE features for the startup are displayed:
         - Numerical features are always active and show the canonical value.
         - Categorical features are active IF AND ONLY IF the startup's one-hot encoded
           transformed row has value == 1.0 (eliminates false opposite categories like
           showing 'Country: USA' for a Singapore startup).
      6. Separation into positive factors (increasing success) and negative factors
         (decreasing success), sorted strictly by impact.
    """
    preprocessor, xgb_model, explainer, feature_names = load_shap_artifacts()

    # 1. Transform canonical startup using the trained pipeline's fitted preprocessor
    transformed_data = preprocessor.transform(startup_df)

    # Convert sparse matrix to dense array for fast indexing
    if hasattr(transformed_data, "toarray"):
        dense_transformed = transformed_data.toarray()
    else:
        dense_transformed = np.asarray(transformed_data)

    n_features = len(feature_names)

    # 2. Strict dimension verification
    if dense_transformed.shape[1] != n_features:
        raise ValueError(
            f"Transformed features count ({dense_transformed.shape[1]}) does not match feature names count ({n_features})"
        )

    # 3. Calculate SHAP values
    shap_output = explainer.shap_values(transformed_data)

    # Extract 1D array of SHAP values for sample 0 (binary positive class = 1)
    if isinstance(shap_output, list):
        if len(shap_output) >= 2:
            sample_shap = shap_output[1][0]
        else:
            sample_shap = shap_output[0][0]
    elif getattr(shap_output, "ndim", 1) == 2:
        sample_shap = shap_output[0]
    elif getattr(shap_output, "ndim", 1) == 3:
        sample_shap = shap_output[0, :, 1]
    else:
        sample_shap = np.asarray(shap_output).flatten()

    sample_shap = np.asarray(sample_shap, dtype=float)

    if len(sample_shap) != n_features:
        raise ValueError(
            f"SHAP output length ({len(sample_shap)}) does not match feature names count ({n_features})"
        )

    # 4. Extract base value and prediction value in margin space
    expected_val = explainer.expected_value
    if isinstance(expected_val, (list, np.ndarray)):
        base_value = float(expected_val[1] if len(expected_val) >= 2 else expected_val[0])
    else:
        base_value = float(expected_val)

    total_shap_sum = float(np.sum(sample_shap))
    prediction_value = round(base_value + total_shap_sum, 4)

    # Retrieve canonical dictionary for value lookups
    canonical_dict = startup_df.iloc[0].to_dict()

    # 5. Build candidate features list by index
    # (strictly pair feature_names[i] with sample_shap[i])
    active_candidates: List[Dict[str, Any]] = []

    for i in range(n_features):
        raw_feat_name = feature_names[i]
        shap_val = float(sample_shap[i])
        transformed_val = float(dense_transformed[0, i])

        display_name, raw_feature, encoded_cat_val, is_categorical = parse_transformed_feature(raw_feat_name)

        if is_categorical:
            # For one-hot encoded categorical features:
            # ONLY include this feature if it is actually ACTIVE for this startup!
            # (i.e. transformed_val == 1.0, not 0.0)
            # This prevents fabricating opposite categories (e.g. showing "Country: USA" for Singapore).
            if transformed_val < 0.5:
                continue

            raw_user_value = str(canonical_dict.get(raw_feature, "Unknown"))
            feature_value = encoded_cat_val or raw_user_value
        else:
            # Numerical feature: always active
            raw_user_value = canonical_dict.get(raw_feature, 0)
            feature_value = raw_user_value

        active_candidates.append({
            "feature": display_name,
            "raw_feature": raw_feature,
            "raw_value": raw_user_value,
            "transformed_feature": raw_feat_name,
            "value": feature_value,
            "impact": round(shap_val, 4),
            "abs_impact": abs(shap_val),
        })

    # 6. Separate into positive and negative contributors
    positive_candidates = [c for c in active_candidates if c["impact"] > 0]
    positive_candidates.sort(key=lambda x: x["impact"], reverse=True)

    negative_candidates = [c for c in active_candidates if c["impact"] < 0]
    negative_candidates.sort(key=lambda x: x["abs_impact"], reverse=True)

    # 7. Take top N
    top_positive = [
        {
            "feature": item["feature"],
            "value": item["value"],
            "impact": item["impact"],
            "raw_feature": item["raw_feature"],
            "raw_value": item["raw_value"],
            "transformed_feature": item["transformed_feature"],
        }
        for item in positive_candidates[:top_n]
    ]

    top_negative = [
        {
            "feature": item["feature"],
            "value": item["value"],
            "impact": item["impact"],
            "raw_feature": item["raw_feature"],
            "raw_value": item["raw_value"],
            "transformed_feature": item["transformed_feature"],
        }
        for item in negative_candidates[:top_n]
    ]

    return {
        "base_value": round(base_value, 4),
        "prediction_value": prediction_value,
        "positive_factors": top_positive,
        "negative_factors": top_negative,
    }


def explain_startup_prediction(
    primary_category: str,
    funding_total_usd: float,
    country_code: str,
    state_code: str = "Unknown",
    region: str = "Unknown",
    city: str = "Unknown",
    funding_rounds: int = 1,
    startup_age: float = 0.0,
    years_to_first_funding: float = 0.0,
    funding_per_round: Optional[float] = None,
    top_n: int = 5
) -> Dict[str, Any]:
    """
    Compute individual SHAP feature contributions for a startup with canonical normalization.
    """
    startup_df = build_startup_dataframe({
        "primary_category": primary_category,
        "funding_total_usd": funding_total_usd,
        "country_code": country_code,
        "state_code": state_code,
        "region": region,
        "city": city,
        "funding_rounds": funding_rounds,
        "startup_age": startup_age,
        "years_to_first_funding": years_to_first_funding,
        "funding_per_round": funding_per_round,
    })

    return explain_startup_prediction_from_df(startup_df, top_n=top_n)


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
            display_name, _, _, _ = parse_transformed_feature(raw_feat)

            if display_name not in seen_features:
                seen_features.add(display_name)
                cleaned_list.append({
                    "feature": display_name,
                    "importance": round(importance, 4),
                    "raw_feature": raw_feat,
                })

            if len(cleaned_list) >= 25:
                break

        _cached_global_importance = cleaned_list
        return _cached_global_importance[:top_n]

    except Exception as err:
        print(f"Error loading global feature importance: {err}")
        return []
