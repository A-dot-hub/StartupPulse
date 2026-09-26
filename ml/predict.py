import joblib
import pandas as pd

from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

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
# PREDICTION FUNCTION
# ============================================================

def predict_startup(
    primary_category,
    funding_total_usd,
    country_code,
    state_code,
    region,
    city,
    funding_rounds,
    startup_age,
    years_to_first_funding,
    funding_per_round
):
    """
    Predict startup success/failure.

    Parameters
    ----------
    primary_category : str
        Main startup category.

    funding_total_usd : float
        Total funding received by the startup.

    country_code : str
        Country code such as USA, IND, GBR.

    state_code : str
        State/province code.

    region : str
        Startup region.

    city : str
        Startup city.

    funding_rounds : int
        Number of funding rounds.

    startup_age : float
        Startup age in years.

    years_to_first_funding : float
        Years between founding and first funding.

    funding_per_round : float
        Average funding per funding round.

    Returns
    -------
    dict
        Prediction result.
    """

    # ========================================================
    # 1. CREATE INPUT DATAFRAME
    # ========================================================

    startup_data = pd.DataFrame([
        {
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
        }
    ])


    # ========================================================
    # 2. CLEAN CATEGORICAL VALUES
    # ========================================================

    categorical_columns = [
        "primary_category",
        "country_code",
        "state_code",
        "region",
        "city"
    ]

    for column in categorical_columns:

        startup_data[column] = (
            startup_data[column]
            .fillna("Unknown")
            .astype(str)
            .str.strip()
        )

        startup_data[column] = startup_data[column].replace(
            "",
            "Unknown"
        )


    # ========================================================
    # 3. CLEAN NUMERICAL VALUES
    # ========================================================

    numerical_columns = [
        "funding_total_usd",
        "funding_rounds",
        "startup_age",
        "years_to_first_funding",
        "funding_per_round"
    ]

    for column in numerical_columns:

        startup_data[column] = pd.to_numeric(
            startup_data[column],
            errors="coerce"
        )

    startup_data[numerical_columns] = (
        startup_data[numerical_columns]
        .fillna(0)
    )


    # ========================================================
    # 4. MODEL PREDICTION
    # ========================================================

    prediction = model.predict(
        startup_data
    )[0]

    probabilities = model.predict_proba(
        startup_data
    )[0]


    # Probability of class 0 = Failure
    failure_probability = probabilities[0]

    # Probability of class 1 = Successful Outcome
    success_probability = probabilities[1]


    # ========================================================
    # 5. DETERMINE PREDICTION LABEL
    # ========================================================

    if prediction == 1:

        prediction_label = "Successful Outcome"

    else:

        prediction_label = "Failure"


    # ========================================================
    # 6. DETERMINE RISK LEVEL
    # ========================================================

    if success_probability >= 0.70:

        risk_level = "Low"

    elif success_probability >= 0.45:

        risk_level = "Medium"

    else:

        risk_level = "High"


    # ========================================================
    # 7. RETURN RESULT
    # ========================================================

    return {
        "prediction": prediction_label,

        "prediction_class": int(prediction),

        "success_probability": round(
            float(success_probability) * 100,
            2
        ),

        "failure_probability": round(
            float(failure_probability) * 100,
            2
        ),

        "risk_level": risk_level
    }


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
