from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pathlib import Path
from datetime import datetime, timezone
import sys
import pandas as pd

from pymongo import MongoClient
from pymongo.errors import PyMongoError

# ============================================================
# PROJECT PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# Import ML prediction function
from ml.predict import predict_startup
from ml.shap_explainer import (
    explain_startup_prediction,
    get_global_feature_importance,
    load_shap_artifacts
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="StartupPulse API",
    description="AI Startup Success & Risk Prediction API",
    version="1.0.0"
)


# ============================================================
# STARTUP EVENT (SHAP & MODEL INITIALIZATION)
# ============================================================

@app.on_event("startup")
def startup_event():
    """
    Initialize and cache model and SHAP TreeExplainer on server start.
    """
    try:
        load_shap_artifacts()
    except Exception as error:
        print(f"SHAP startup initialization notice: {error}")


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
# MONGODB CONFIGURATION
# ============================================================

MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "startuppulse"
COLLECTION_NAME = "predictions"

mongo_client = None
db = None
predictions_collection = None


def connect_mongodb():
    """
    Connect to local MongoDB.
    """

    global mongo_client
    global db
    global predictions_collection

    try:
        mongo_client = MongoClient(
            MONGO_URL,
            serverSelectionTimeoutMS=3000
        )

        # Force connection test
        mongo_client.admin.command("ping")

        db = mongo_client[DATABASE_NAME]
        predictions_collection = db[COLLECTION_NAME]

        print("MongoDB connected successfully")
        print(f"Database: {DATABASE_NAME}")
        print(f"Collection: {COLLECTION_NAME}")

        return True

    except PyMongoError as error:
        print(f"MongoDB connection failed: {error}")

        mongo_client = None
        db = None
        predictions_collection = None

        return False


# Connect when API starts
mongo_connected = connect_mongodb()


# ============================================================
# PYDANTIC INPUT MODEL
# ============================================================

class StartupInput(BaseModel):
    primary_category: str = Field(..., min_length=1)

    funding_total_usd: float = Field(
        ...,
        ge=0
    )

    country_code: str = Field(..., min_length=1)

    state_code: str = Field(
        default="Unknown"
    )

    region: str = Field(
        default="Unknown"
    )

    city: str = Field(
        default="Unknown"
    )

    funding_rounds: int = Field(
        ...,
        ge=1
    )

    startup_age: float = Field(
        ...,
        ge=0
    )

    years_to_first_funding: float = Field(
        ...,
        ge=0
    )

    funding_per_round: float = Field(
        ...,
        ge=0
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to StartupPulse API",
        "status": "running",
        "version": "1.0.0"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    mongodb_status = "connected" if predictions_collection is not None else "disconnected"

    return {
        "status": "healthy",
        "model": "XGBoost",
        "service": "StartupPulse API",
        "mongodb": mongodb_status
    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
def predict_startup_api(startup: StartupInput):

    try:

        # ----------------------------------------------------
        # Run ML model
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Calculate SHAP explanation (with error resilience)
        # ----------------------------------------------------

        explanation = None
        try:
            explanation = explain_startup_prediction(
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
        except Exception as shap_error:
            print(f"SHAP explanation calculation failed: {shap_error}")
            explanation = None

        result["explanation"] = explanation

        # ----------------------------------------------------
        # Prepare prediction document
        # ----------------------------------------------------

        prediction_document = {
            "input": startup.model_dump(),

            "prediction": result["prediction"],
            "prediction_class": result["prediction_class"],

            "success_probability": result["success_probability"],
            "failure_probability": result["failure_probability"],

            "risk_level": result["risk_level"],

            "explanation": explanation,

            "model": "XGBoost",

            "created_at": datetime.now(timezone.utc)
        }

        # ----------------------------------------------------
        # Save to MongoDB
        # ----------------------------------------------------

        saved = False

        if predictions_collection is not None:

            try:

                insert_result = predictions_collection.insert_one(
                    prediction_document
                )

                prediction_id = str(insert_result.inserted_id)

                saved = True

            except PyMongoError as error:

                print(f"MongoDB save failed: {error}")

                prediction_id = None

        else:

            prediction_id = None

        # ----------------------------------------------------
        # API RESPONSE
        # ----------------------------------------------------

        return {
            "success": True,

            "data": result,

            "prediction_id": prediction_id,

            "saved_to_database": saved
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# SHAP EXPLANATION
# ============================================================

@app.post("/explain")
def explain_startup_api(startup: StartupInput):
    """
    Generate individual SHAP feature contributions for a specific startup.
    Returns:
    {
        "success": true,
        "data": {
            "base_value": 0.42,
            "prediction_value": 0.58,
            "positive_factors": [...],
            "negative_factors": [...]
        }
    }
    """
    try:
        explanation = explain_startup_prediction(
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
            "data": explanation
        }

    except Exception as error:
        print(f"SHAP /explain endpoint error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Detailed explanation is temporarily unavailable."
        )


# ============================================================
# PREDICTION HISTORY
# ============================================================

@app.get("/history")
def get_prediction_history(limit: int = 20):

    if predictions_collection is None:

        raise HTTPException(
            status_code=503,
            detail="MongoDB is not connected"
        )

    try:

        limit = min(max(limit, 1), 100)

        predictions = list(
            predictions_collection
            .find()
            .sort("created_at", -1)
            .limit(limit)
        )

        history = []

        for prediction in predictions:

            history.append({
                "id": str(prediction["_id"]),

                "input": prediction.get(
                    "input",
                    {}
                ),

                "prediction": prediction.get(
                    "prediction"
                ),

                "prediction_class": prediction.get(
                    "prediction_class"
                ),

                "success_probability": prediction.get(
                    "success_probability"
                ),

                "failure_probability": prediction.get(
                    "failure_probability"
                ),

                "risk_level": prediction.get(
                    "risk_level"
                ),

                "explanation": prediction.get(
                    "explanation"
                ),

                "model": prediction.get(
                    "model"
                ),

                "created_at": prediction.get(
                    "created_at"
                ).isoformat()
                if prediction.get("created_at")
                else None
            })

        return {
            "success": True,
            "count": len(history),
            "data": history
        }

    except PyMongoError as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# GET SINGLE PREDICTION
# ============================================================

@app.get("/history/{prediction_id}")
def get_prediction(prediction_id: str):

    if predictions_collection is None:

        raise HTTPException(
            status_code=503,
            detail="MongoDB is not connected"
        )

    try:

        from bson import ObjectId

        prediction = predictions_collection.find_one(
            {
                "_id": ObjectId(prediction_id)
            }
        )

        if prediction is None:

            raise HTTPException(
                status_code=404,
                detail="Prediction not found"
            )

        return {
            "success": True,
            "data": {
                "id": str(prediction["_id"]),
                "input": prediction.get("input", {}),
                "prediction": prediction.get("prediction"),
                "prediction_class": prediction.get("prediction_class"),
                "success_probability": prediction.get("success_probability"),
                "failure_probability": prediction.get("failure_probability"),
                "risk_level": prediction.get("risk_level"),
                "explanation": prediction.get("explanation"),
                "model": prediction.get("model"),
                "created_at": prediction.get("created_at").isoformat()
                if prediction.get("created_at")
                else None
            }
        }

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid prediction ID"
        )

    except PyMongoError as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/model-info")
def get_model_info():

    comparison_path = (
        BASE_DIR
        / "ml"
        / "models"
        / "model_comparison.csv"
    )

    if not comparison_path.exists():

        raise HTTPException(
            status_code=404,
            detail="model_comparison.csv not found"
        )

    try:

        df = pd.read_csv(comparison_path)

        # Convert entire comparison table into JSON-compatible format
        models = df.to_dict(
            orient="records"
        )

        # Find XGBoost row
        xgb_rows = df[
            df["Model"].astype(str).str.lower().str.contains(
                "xgboost"
            )
        ]

        selected_model = "XGBoost"

        selected_metrics = {}

        if not xgb_rows.empty:

            row = xgb_rows.iloc[0]

            for column in df.columns:

                if column != "Model":

                    value = row[column]

                    if pd.notna(value):

                        try:
                            value = float(value)
                        except (ValueError, TypeError):
                            value = str(value)

                    selected_metrics[column] = value

        global_features = get_global_feature_importance(15)

        return {
            "success": True,

            "selected_model": selected_model,

            "selected_metrics": selected_metrics,

            "models": models,

            "global_feature_importance": global_features,

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

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# SHUTDOWN
# ============================================================

@app.on_event("shutdown")
def shutdown_event():

    global mongo_client

    if mongo_client is not None:

        mongo_client.close()

        print("MongoDB connection closed")


# ============================================================
# DIRECT RUN
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

# ### 4. Start MongoDB + FastAPI

# Make sure MongoDB service is running first.

# Then:

# ```powershell
# .\venv\Scripts\python.exe -m uvicorn backend.main:app --reload
# ```

# You want to see:

# ```text
# MongoDB connected successfully
# Database: startuppulse
# Collection: predictions
# ```

# Then open:

# ```text
# http://127.0.0.1:8000/docs
# ```

# ### 5. Test in this order

# #### A. Test `/health`

# Click **GET `/health` → Try it out → Execute**.

# You should get:

# ```json
# {
#   "status": "healthy",
#   "model": "XGBoost",
#   "service": "StartupPulse API",
#   "mongodb": "connected"
# }
# ```

# #### B. Test `/model-info`

# This is now **dynamic**.

# It reads:

# ```text
# ml/models/model_comparison.csv
# ```

# instead of using:

# ```python
# 0.7630
# 0.7537
# 0.8238
# ...
# ```

# So when you retrain the models later, the API automatically reflects the CSV.

# #### C. Test `/predict`

# Use:

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

# The response should contain:

# ```json
# {
#   "success": true,
#   "data": {
#     "prediction": "...",
#     "prediction_class": 1,
#     "success_probability": 0,
#     "failure_probability": 0,
#     "risk_level": "..."
#   },
#   "prediction_id": "...",
#   "saved_to_database": true
# }
# ```

# The probability numbers will come from your actual model.

# ### 6. Verify MongoDB

# Open **MongoDB Compass** and connect to:

# ```text
# mongodb://localhost:27017
# ```

# You should now see:

# ```text
# startuppulse
#     └── predictions
# ```

# and inside `predictions`, your prediction should be stored.

# ### 7. Test prediction history

# In Swagger, call:

# ```text
# GET /history
# ```

# You should get the predictions you just created.

# ---

# ### Our backend is then essentially structured like this

# ```text
# React Frontend
#        │
#        │ POST /predict
#        ▼
#    FastAPI
#        │
#        ├──────────────► XGBoost Model
#        │                    │
#        │                    ▼
#        │             Prediction Result
#        │
#        └──────────────► MongoDB
#                             │
#                             ▼
#                      Prediction History
# ```

# **Run the install + FastAPI test first.** If `/health`, `/model-info`, `/predict`, and `/history` all work, the next stage is the **React frontend**, where we'll build the StartupPulse dashboard and connect it to these APIs.