import pandas as pd
import numpy as np
import joblib

from pathlib import Path

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from xgboost import XGBClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODEL_DIR = BASE_DIR / "ml" / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# 1. LOAD PROCESSED DATA
# ============================================================

print("\nLoading processed dataset...")

X_train = pd.read_csv(PROCESSED_DIR / "X_train.csv")
X_test = pd.read_csv(PROCESSED_DIR / "X_test.csv")

y_train = pd.read_csv(PROCESSED_DIR / "y_train.csv").squeeze()
y_test = pd.read_csv(PROCESSED_DIR / "y_test.csv").squeeze()

print(f"X_train shape: {X_train.shape}")
print(f"X_test shape:  {X_test.shape}")

print("\nTraining target distribution:")
print(y_train.value_counts())


# ============================================================
# 2. DEFINE FEATURES
# ============================================================

categorical_features = [
    "primary_category",
    "country_code",
    "state_code",
    "region",
    "city"
]

numerical_features = [
    "funding_total_usd",
    "funding_rounds",
    "startup_age",
    "years_to_first_funding",
    "funding_per_round"
]


# ============================================================
# 3. PREPROCESSING PIPELINE
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            categorical_features
        ),
        (
            "numerical",
            StandardScaler(),
            numerical_features
        )
    ]
)


# ============================================================
# 4. DEFINE MODELS
# ============================================================

models = {

    "Logistic Regression": LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=42
    ),

    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        max_depth=15,
        min_samples_split=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    ),

    "XGBoost": XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1
    )
}


# ============================================================
# 5. TRAIN AND EVALUATE MODELS
# ============================================================

results = []

trained_pipelines = {}

for model_name, model in models.items():

    print("\n" + "=" * 70)
    print(f"TRAINING: {model_name}")
    print("=" * 70)

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model)
        ]
    )

    # --------------------------------------------------------
    # Train
    # --------------------------------------------------------

    pipeline.fit(X_train, y_train)

    # --------------------------------------------------------
    # Predictions
    # --------------------------------------------------------

    y_pred = pipeline.predict(X_test)

    y_probability = pipeline.predict_proba(X_test)[:, 1]

    # --------------------------------------------------------
    # Metrics
    # --------------------------------------------------------

    accuracy = accuracy_score(
        y_test,
        y_pred
    )

    precision = precision_score(
        y_test,
        y_pred,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        y_pred,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        y_pred,
        zero_division=0
    )

    roc_auc = roc_auc_score(
        y_test,
        y_probability
    )

    # --------------------------------------------------------
    # Store results
    # --------------------------------------------------------

    results.append({
        "Model": model_name,
        "Accuracy": accuracy,
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
        "ROC_AUC": roc_auc
    })

    trained_pipelines[model_name] = pipeline

    # --------------------------------------------------------
    # Print results
    # --------------------------------------------------------

    print(f"\nAccuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"ROC-AUC  : {roc_auc:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            target_names=[
                "Failure",
                "Successful Outcome"
            ],
            zero_division=0
        )
    )

    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))


# ============================================================
# 6. CREATE MODEL COMPARISON TABLE
# ============================================================

results_df = pd.DataFrame(results)

results_df = results_df.sort_values(
    by="ROC_AUC",
    ascending=False
)

print("\n")
print("=" * 80)
print("MODEL COMPARISON")
print("=" * 80)

print(
    results_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.4f}"
    )
)


# ============================================================
# 7. SELECT BEST MODEL
# ============================================================

best_model_name = results_df.iloc[0]["Model"]

best_pipeline = trained_pipelines[
    best_model_name
]

print("\n" + "=" * 80)
print("SELECTED MODEL")
print("=" * 80)

print(f"Best model based on ROC-AUC: {best_model_name}")


# ============================================================
# 8. SAVE BEST MODEL
# ============================================================

model_path = MODEL_DIR / "startup_model.pkl"

joblib.dump(
    best_pipeline,
    model_path
)

print(f"\nBest model saved to:")
print(model_path)


# ============================================================
# 9. SAVE MODEL COMPARISON
# ============================================================

results_path = MODEL_DIR / "model_comparison.csv"

results_df.to_csv(
    results_path,
    index=False
)

print(f"\nModel comparison saved to:")
print(results_path)


# ============================================================
# 10. SAVE MODEL NAME
# ============================================================

model_info = {
    "model_name": best_model_name,
    "selection_metric": "ROC-AUC"
}

joblib.dump(
    model_info,
    MODEL_DIR / "model_info.pkl"
)


# ============================================================
# 11. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 80)
print("TRAINING COMPLETED SUCCESSFULLY")
print("=" * 80)

print("\nFinal model:")
print(f"  {best_model_name}")

best_row = results_df.iloc[0]

print("\nFinal metrics:")

print(
    f"  Accuracy : {best_row['Accuracy']:.4f}"
)

print(
    f"  Precision: {best_row['Precision']:.4f}"
)

print(
    f"  Recall   : {best_row['Recall']:.4f}"
)

print(
    f"  F1 Score : {best_row['F1']:.4f}"
)

print(
    f"  ROC-AUC  : {best_row['ROC_AUC']:.4f}"
)

print("\nGenerated files:")

print(f"  {model_path}")
print(f"  {results_path}")
print(f"  {MODEL_DIR / 'model_info.pkl'}")

print("\nReady for FastAPI integration.")
# ```

# ### Run it

# After successfully running `preprocess.py`:

# ```powershell
# python ml/train.py
# ```

# It will train:

# ```text
# Logistic Regression
#         ↓
# Random Forest
#         ↓
# XGBoost
# ```

# and produce a comparison similar to:

# ```text
# ================================================================================
# MODEL COMPARISON
# ================================================================================
#              Model  Accuracy  Precision  Recall      F1  ROC_AUC
#             XGBoost    ....      ....      ....    ....    ....
#       Random Forest    ....      ....      ....    ....    ....
#  Logistic Regression    ....      ....      ....    ....    ....
# ```

# **Don't assume XGBoost will be the winner.** The script selects the model based on the actual ROC-AUC obtained from your dataset.

# ### Files generated

# After training:

# ```text
# StartupPulse/
# │
# ├── data/
# │   └── processed/
# │       ├── X_train.csv
# │       ├── X_test.csv
# │       ├── y_train.csv
# │       ├── y_test.csv
# │       └── startup_processed.csv
# │
# └── ml/
#     ├── eda.py
#     ├── preprocess.py
#     ├── train.py
#     │
#     └── models/
#         ├── startup_model.pkl
#         ├── model_comparison.csv
#         └── model_info.pkl
# ```

# One important benefit of this implementation is that **the saved `startup_model.pkl` contains the preprocessing + model together**. Therefore, when we build FastAPI later, a new startup's raw categorical/numerical inputs can go directly into the same pipeline without manually reproducing the training transformations.

# Run:

# ```powershell
# python ml/train.py
# ```

# and send me the **`MODEL COMPARISON` output**. Then we can inspect which model actually performs best before building the FastAPI prediction endpoint.
