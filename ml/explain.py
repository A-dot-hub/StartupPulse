import pandas as pd
import numpy as np
import joblib
import shap
import matplotlib.pyplot as plt

from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

PROCESSED_DIR = BASE_DIR / "data" / "processed"
MODEL_DIR = BASE_DIR / "ml" / "models"

MODEL_PATH = MODEL_DIR / "startup_model.pkl"

OUTPUT_DIR = MODEL_DIR / "shap"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# 1. LOAD TRAINED MODEL
# ============================================================

print("\nLoading trained StartupPulse model...")

pipeline = joblib.load(MODEL_PATH)

print("Model loaded successfully.")


# ============================================================
# 2. LOAD TEST DATA
# ============================================================

X_test = pd.read_csv(
    PROCESSED_DIR / "X_test.csv"
)

y_test = pd.read_csv(
    PROCESSED_DIR / "y_test.csv"
).squeeze()

print(f"\nTest dataset shape: {X_test.shape}")


# ============================================================
# 3. EXTRACT PREPROCESSOR AND MODEL
# ============================================================

preprocessor = pipeline.named_steps["preprocessor"]
model = pipeline.named_steps["model"]

print("\nModel type:")
print(type(model).__name__)


# ============================================================
# 4. TRANSFORM TEST DATA
# ============================================================

print("\nTransforming test data...")

X_test_transformed = preprocessor.transform(X_test)

print(
    f"Transformed feature shape: "
    f"{X_test_transformed.shape}"
)


# ============================================================
# 5. GET FEATURE NAMES
# ============================================================

feature_names = preprocessor.get_feature_names_out()

print(
    f"\nNumber of transformed features: "
    f"{len(feature_names)}"
)


# ============================================================
# 6. CREATE SHAP EXPLAINER
# ============================================================

print("\nCreating SHAP explainer...")

explainer = shap.TreeExplainer(model)

shap_values = explainer.shap_values(
    X_test_transformed
)

print("SHAP values generated successfully.")


# ============================================================
# 7. GLOBAL FEATURE IMPORTANCE
# ============================================================

print("\nCalculating global feature importance...")

mean_abs_shap = np.abs(shap_values).mean(axis=0)

importance_df = pd.DataFrame({
    "feature": feature_names,
    "mean_abs_shap": mean_abs_shap
})

importance_df = importance_df.sort_values(
    by="mean_abs_shap",
    ascending=False
)

print("\nTop 20 features:")

print(
    importance_df.head(20).to_string(
        index=False
    )
)


# ============================================================
# 8. SAVE FEATURE IMPORTANCE
# ============================================================

importance_path = (
    OUTPUT_DIR /
    "feature_importance.csv"
)

importance_df.to_csv(
    importance_path,
    index=False
)

print(
    f"\nFeature importance saved to:\n"
    f"{importance_path}"
)


# ============================================================
# 9. GLOBAL SHAP BAR PLOT
# ============================================================

print("\nCreating global SHAP plot...")

plt.figure()

shap.summary_plot(
    shap_values,
    X_test_transformed,
    feature_names=feature_names,
    plot_type="bar",
    max_display=20,
    show=False
)

plt.title(
    "StartupPulse - Global SHAP Feature Importance"
)

plt.tight_layout()

global_plot_path = (
    OUTPUT_DIR /
    "global_feature_importance.png"
)

plt.savefig(
    global_plot_path,
    dpi=300,
    bbox_inches="tight"
)

plt.close()

print(
    f"Global SHAP plot saved to:\n"
    f"{global_plot_path}"
)


# ============================================================
# 10. SHAP SUMMARY PLOT
# ============================================================

print("\nCreating SHAP summary plot...")

plt.figure()

shap.summary_plot(
    shap_values,
    X_test_transformed,
    feature_names=feature_names,
    max_display=20,
    show=False
)

plt.title(
    "StartupPulse - SHAP Summary"
)

plt.tight_layout()

summary_plot_path = (
    OUTPUT_DIR /
    "shap_summary.png"
)

plt.savefig(
    summary_plot_path,
    dpi=300,
    bbox_inches="tight"
)

plt.close()

print(
    f"SHAP summary saved to:\n"
    f"{summary_plot_path}"
)


# ============================================================
# 11. INDIVIDUAL STARTUP EXPLANATION
# ============================================================

def explain_startup(index=0):
    """
    Explain one startup from the test dataset.

    index:
        Row number from X_test.csv
    """

    print("\n" + "=" * 70)
    print("INDIVIDUAL STARTUP EXPLANATION")
    print("=" * 70)

    # --------------------------------------------------------
    # Select startup
    # --------------------------------------------------------

    startup = X_test.iloc[[index]]

    actual_target = y_test.iloc[index]

    # --------------------------------------------------------
    # Transform startup
    # --------------------------------------------------------

    startup_transformed = preprocessor.transform(
        startup
    )

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    prediction = pipeline.predict(
        startup
    )[0]

    probability = pipeline.predict_proba(
        startup
    )[0][1]

    # --------------------------------------------------------
    # SHAP values
    # --------------------------------------------------------

    startup_shap = explainer.shap_values(
        startup_transformed
    )[0]

    explanation_df = pd.DataFrame({
        "feature": feature_names,
        "shap_value": startup_shap
    })

    explanation_df["impact"] = (
        explanation_df["shap_value"]
        .abs()
    )

    explanation_df = explanation_df.sort_values(
        by="impact",
        ascending=False
    )

    # --------------------------------------------------------
    # Positive / negative factors
    # --------------------------------------------------------

    positive_factors = (
        explanation_df[
            explanation_df["shap_value"] > 0
        ]
        .head(10)
    )

    negative_factors = (
        explanation_df[
            explanation_df["shap_value"] < 0
        ]
        .head(10)
    )

    # --------------------------------------------------------
    # Print prediction
    # --------------------------------------------------------

    print(
        f"\nPrediction: "
        f"{'Successful Outcome' if prediction == 1 else 'Failure'}"
    )

    print(
        f"Success probability: "
        f"{probability * 100:.2f}%"
    )

    print(
        f"Actual target: "
        f"{'Successful Outcome' if actual_target == 1 else 'Failure'}"
    )

    # --------------------------------------------------------
    # Positive factors
    # --------------------------------------------------------

    print("\nTop factors pushing prediction toward SUCCESS:")

    if len(positive_factors) == 0:

        print("  None")

    else:

        for _, row in positive_factors.iterrows():

            print(
                f"  + {row['feature']}: "
                f"{row['shap_value']:.6f}"
            )

    # --------------------------------------------------------
    # Negative factors
    # --------------------------------------------------------

    print("\nTop factors pushing prediction toward FAILURE:")

    if len(negative_factors) == 0:

        print("  None")

    else:

        for _, row in negative_factors.iterrows():

            print(
                f"  - {row['feature']}: "
                f"{row['shap_value']:.6f}"
            )

    return {
        "prediction": int(prediction),
        "success_probability": float(probability),
        "positive_factors": positive_factors.to_dict(
            orient="records"
        ),
        "negative_factors": negative_factors.to_dict(
            orient="records"
        )
    }


# ============================================================
# 12. RUN SAMPLE EXPLANATION
# ============================================================

sample_explanation = explain_startup(index=0)


# ============================================================
# 13. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("SHAP ANALYSIS COMPLETED")
print("=" * 70)

print("\nGenerated files:")

print(
    f"  {importance_path}"
)

print(
    f"  {global_plot_path}"
)

print(
    f"  {summary_plot_path}"
)

print("\nStartupPulse now has explainable AI support.")
# ```

# ### Run it

# From your project root:

# ```powershell
# python ml/explain.py
# ```

# It should create:

# ```text
# StartupPulse/
# │
# ├── ml/
# │   ├── explain.py
# │   │
# │   └── models/
# │       ├── startup_model.pkl
# │       ├── model_comparison.csv
# │       ├── model_info.pkl
# │       │
# │       └── shap/
# │           ├── feature_importance.csv
# │           ├── global_feature_importance.png
# │           └── shap_summary.png
# ```

# ### What we're getting from SHAP

# There are two important levels.

# **Global explanation**

# ```text
# Which features generally influence StartupPulse predictions?
# ```

# This produces:

# ```text
# feature                  mean_abs_shap
# --------------------------------------
# funding_total_usd        ...
# funding_rounds            ...
# startup_age               ...
# ...
# ```

# **Individual explanation**

# For one startup:

# ```text
# Prediction: Successful Outcome
# Success probability: XX.XX%

# Top factors pushing prediction toward SUCCESS:
#   + feature A
#   + feature B

# Top factors pushing prediction toward FAILURE:
#   - feature C
#   - feature D
# ```

# This is exactly what we'll eventually expose in the React **Explainable AI** dashboard.

# One important detail: the SHAP output is based on the **actual trained XGBoost model**, not hardcoded explanations.

# Run:

# ```powershell
# python ml/explain.py
# ```

# and send me the output, especially the **Top 20 features** and the **individual startup explanation**. Then we'll build the FastAPI backend around the same saved pipeline.
