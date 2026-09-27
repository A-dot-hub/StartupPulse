import joblib
import pandas as pd

from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from ml.input_utils import build_startup_dataframe, normalize_startup_dict


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = (
    BASE_DIR
    / "ml"
    / "models"
    / "startup_model.pkl"
)


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

print("Loading StartupPulse model...")

model = joblib.load(MODEL_PATH)

print("StartupPulse model loaded successfully.")


# ============================================================
# PREDICTION FUNCTION FROM CANONICAL DATAFRAME
# ============================================================

def predict_startup_from_df(startup_df: pd.DataFrame, trained_model=None):
    """
    Run XGBoost model prediction on single canonical DataFrame.
    """
    m = trained_model or model

    prediction = m.predict(startup_df)[0]
    probabilities = m.predict_proba(startup_df)[0]

    # Probability of class 0 = Failure
    failure_probability = float(probabilities[0])

    # Probability of class 1 = Successful Outcome
    success_probability = float(probabilities[1])

    if prediction == 1:
        prediction_label = "Successful Outcome"
    else:
        prediction_label = "Failure"

    if success_probability >= 0.70:
        risk_level = "Low"
    elif success_probability >= 0.45:
        risk_level = "Medium"
    else:
        risk_level = "High"

    canonical_dict = startup_df.iloc[0].to_dict()

    return {
        "prediction": prediction_label,
        "prediction_class": int(prediction),
        "success_probability": round(success_probability * 100, 2),
        "failure_probability": round(failure_probability * 100, 2),
        "risk_level": risk_level,
        "input": canonical_dict
    }


def predict_startup(
    primary_category,
    funding_total_usd,
    country_code,
    state_code="Unknown",
    region="Unknown",
    city="Unknown",
    funding_rounds=1,
    startup_age=0.0,
    years_to_first_funding=0.0,
    funding_per_round=None
):
    """
    Predict startup success/failure using single canonical input normalization.
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
        "funding_per_round": funding_per_round
    })

    return predict_startup_from_df(startup_df)


# ============================================================
# TEST FUNCTION
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 70)
    print("STARTUPPULSE PREDICTION TEST")
    print("=" * 70)

    result = predict_startup(

        primary_category="Software",

        funding_total_usd=5000000,

        country_code="USA",

        state_code="CA",

        region="SF Bay Area",

        city="San Francisco",

        funding_rounds=3,

        startup_age=5,

        years_to_first_funding=1,

        funding_per_round=1666666.67
    )


    print("\nPrediction Result:")
    print("-" * 40)

    print(
        f"Prediction: "
        f"{result['prediction']}"
    )

    print(
        f"Success Probability: "
        f"{result['success_probability']}%"
    )

    print(
        f"Failure Probability: "
        f"{result['failure_probability']}%"
    )

    print(
        f"Risk Level: "
        f"{result['risk_level']}"
    )

    print("\nFull result:")
    print(result)

    print("\nPrediction test completed.")

# ```

# ### Run the prediction test

# From your project root:

# ```powershell
# python ml/predict.py
# ```

# You should get something like:

# ```text
# ======================================================================
# STARTUPPULSE PREDICTION TEST
# ======================================================================

# Prediction Result:
# ----------------------------------------
# Prediction: Successful Outcome
# Success Probability: XX.XX%
# Failure Probability: XX.XX%
# Risk Level: XX

# Full result:
# {
#     'prediction': '...',
#     'prediction_class': 1,
#     'success_probability': ...,
#     'failure_probability': ...,
#     'risk_level': '...'
# }

# Prediction test completed.
# ```

# The actual numbers will be produced by your **saved XGBoost model**, so don't expect the example values above.

# ### One important design point

# Your current model uses these **10 input features**:

# ```text
# primary_category
# funding_total_usd
# country_code
# state_code
# region
# city
# funding_rounds
# startup_age
# years_to_first_funding
# funding_per_round
# ```

# So this function deliberately accepts exactly those fields. Later, FastAPI can receive the same fields from the React form:

# ```text
# React Startup Form
#        ↓
# POST /predict
#        ↓
# FastAPI
#        ↓
# predict_startup()
#        ↓
# startup_model.pkl
#        ↓
# Prediction + Probability + Risk
# ```

# Run `python ml/predict.py` next. Once that works, we can build **`backend/main.py`** and expose this as your first real API endpoint.
