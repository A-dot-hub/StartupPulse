from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field

import sys
from pathlib import Path


# ============================================================
# PROJECT PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# Allow Python to find the ml package
sys.path.append(str(BASE_DIR))


# ============================================================
# IMPORT ML PREDICTION FUNCTION
# ============================================================

from ml.predict import predict_startup


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="StartupPulse API",
    description="AI Startup Success & Risk Prediction API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class StartupInput(BaseModel):

    primary_category: str = Field(
        ...,
        description="Primary startup category"
    )

    funding_total_usd: float = Field(
        ...,
        ge=0,
        description="Total startup funding in USD"
    )

    country_code: str = Field(
        ...,
        description="Country code, e.g. USA"
    )

    state_code: str = Field(
        default="Unknown",
        description="State or province code"
    )

    region: str = Field(
        default="Unknown",
        description="Startup region"
    )

    city: str = Field(
        default="Unknown",
        description="Startup city"
    )

    funding_rounds: int = Field(
        ...,
        ge=1,
        description="Number of funding rounds"
    )

    startup_age: float = Field(
        ...,
        ge=0,
        description="Startup age in years"
    )

    years_to_first_funding: float = Field(
        ...,
        ge=0,
        description="Years between founding and first funding"
    )

    funding_per_round: float = Field(
        ...,
        ge=0,
        description="Average funding per funding round"
    )


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():

    return {
        "message": "StartupPulse API is running",
        "version": "1.0.0",
        "status": "online"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "model": "XGBoost",
        "service": "StartupPulse"
    }


# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@app.post("/predict")
def predict(startup: StartupInput):

    try:

        result = predict_startup(

            primary_category=startup.primary_category,

            funding_total_usd=startup.funding_total_usd,

            country_code=startup.country_code,

            state_code=startup.state_code,

            region=startup.region,

            city=startup.city,

            funding_rounds=startup.funding_rounds,

            startup_age=startup.startup_age,

            years_to_first_funding=startup.years_to_first_funding,

            funding_per_round=startup.funding_per_round
        )

        return {
            "success": True,
            "data": result
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/model-info")
def model_info():

    return {
        "model": "XGBoost",

        "task": "Binary Classification",

        "target": {
            "0": "Failure",
            "1": "Successful Outcome"
        },

        "metrics": {
            "accuracy": 0.7630,
            "precision": 0.7537,
            "recall": 0.8238,
            "f1_score": 0.7872,
            "roc_auc": 0.8355
        },

        "features": [
            "primary_category",
            "funding_total_usd",
            "country_code",
            "state_code",
            "region",
            "city",
            "funding_rounds",
            "startup_age",
            "years_to_first_funding",
            "funding_per_round"
        ]
    }


# ============================================================
# RUN DIRECTLY
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )


# ```

# ### Install FastAPI dependencies

# If you haven't installed them yet:

# ```powershell
# pip install fastapi uvicorn pydantic
# ```

# Then run from the **StartupPulse root folder**:

# ```powershell
# python -m uvicorn backend.main:app --reload
# ```

# You should see:

# ```text
# INFO:     Uvicorn running on http://127.0.0.1:8000
# ```

# ### Test it

# Open:

# ```text
# http://127.0.0.1:8000
# ```

# You should get:

# ```json
# {
#   "message": "StartupPulse API is running",
#   "version": "1.0.0",
#   "status": "online"
# }
# ```

# Health:

# ```text
# http://127.0.0.1:8000/health
# ```

# And FastAPI automatically gives you interactive API documentation at:

# ```text
# http://127.0.0.1:8000/docs
# ```

# In `/docs`, open **POST `/predict` → Try it out** and use:

# ```json
# {
#   "primary_category": "Software",
#   "funding_total_usd": 5000000,
#   "country_code": "USA",
#   "state_code": "CA",
#   "region": "SF Bay Area",
#   "city": "San Francisco",
#   "funding_rounds": 3,
#   "startup_age": 5,
#   "years_to_first_funding": 1,
#   "funding_per_round": 1666666.67
# }
# ```

# The response will be generated by your actual saved XGBoost model:

# ```json
# {
#   "success": true,
#   "data": {
#     "prediction": "...",
#     "prediction_class": 1,
#     "success_probability": 0,
#     "failure_probability": 0,
#     "risk_level": "..."
#   }
# }
# ```

# The probability values above are placeholders—the API will return the actual model output.

# ### Current architecture

# ```text
#                  StartupPulse
#                       │
#           ┌───────────┴───────────┐
#           │                       │
#        React.js               FastAPI
#           │                       │
#           │                  POST /predict
#           │                       │
#           │                  ml/predict.py
#           │                       │
#           │                startup_model.pkl
#           │                       │
#           │                    XGBoost
#           │
#           └─────── Prediction Dashboard
# ```

# One correction for the next stage: the `/model-info` metrics are currently copied from this training run. Later, we'll load them from `model_comparison.csv` instead of hardcoding them, so the API automatically reflects the latest trained model.

# **Next major step after verifying `/docs` is MongoDB integration**, followed by the React frontend.
