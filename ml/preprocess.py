import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = BASE_DIR / "data" / "big_startup_secsees_dataset.csv"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# 1. LOAD DATASET
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print(f"Original dataset shape: {df.shape}")


# ============================================================
# 2. CLEAN COLUMN NAMES
# ============================================================

df.columns = df.columns.str.strip()


# ============================================================
# 3. CREATE BINARY TARGET
# ============================================================
#
# closed   -> 0 (Failure)
# acquired -> 1 (Successful outcome)
# ipo      -> 1 (Successful outcome)
#
# operating is excluded because an operating startup does not
# necessarily represent a completed success/failure outcome.
# ============================================================

target_statuses = ["closed", "acquired", "ipo"]

df = df[df["status"].isin(target_statuses)].copy()

df["target"] = df["status"].map({
    "closed": 0,
    "acquired": 1,
    "ipo": 1
})


print("\nTarget distribution:")
print(df["target"].value_counts())

print("\nTarget percentages:")
print(
    df["target"]
    .value_counts(normalize=True)
    .mul(100)
    .round(2)
)


# ============================================================
# 4. CONVERT FUNDING TO NUMERIC
# ============================================================

df["funding_total_usd"] = pd.to_numeric(
    df["funding_total_usd"],
    errors="coerce"
)

df["funding_total_usd"] = df["funding_total_usd"].fillna(0)


# ============================================================
# 5. CONVERT DATE COLUMNS
# ============================================================

date_columns = [
    "founded_at",
    "first_funding_at",
    "last_funding_at"
]

for column in date_columns:
    df[column] = pd.to_datetime(
        df[column],
        errors="coerce"
    )


# ============================================================
# 6. FEATURE ENGINEERING
# ============================================================

# ------------------------------------------------------------
# Startup age at the time of last recorded funding
# ------------------------------------------------------------

df["startup_age"] = (
    df["last_funding_at"] - df["founded_at"]
).dt.days / 365.25

df["startup_age"] = df["startup_age"].clip(lower=0)


# ------------------------------------------------------------
# Time between founding and first funding
# ------------------------------------------------------------

df["years_to_first_funding"] = (
    df["first_funding_at"] - df["founded_at"]
).dt.days / 365.25

df["years_to_first_funding"] = (
    df["years_to_first_funding"].clip(lower=0)
)


# ------------------------------------------------------------
# Average funding per funding round
# ------------------------------------------------------------

df["funding_per_round"] = (
    df["funding_total_usd"] /
    df["funding_rounds"].replace(0, np.nan)
)

df["funding_per_round"] = (
    df["funding_per_round"].fillna(0)
)


# ============================================================
# 7. CLEAN CATEGORY LIST
# ============================================================

# A startup can have multiple categories:
#
# "Software, SaaS, Enterprise Software"
#
# For the first model, we use the first category.

df["primary_category"] = (
    df["category_list"]
    .fillna("Unknown")
    .astype(str)
    .str.split(",")
    .str[0]
    .str.strip()
)

df["primary_category"] = (
    df["primary_category"]
    .replace("", "Unknown")
)


# ============================================================
# 8. SELECT FEATURES
# ============================================================

feature_columns = [
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

X = df[feature_columns].copy()
y = df["target"].copy()


# ============================================================
# 9. CLEAN CATEGORICAL FEATURES
# ============================================================

categorical_columns = [
    "primary_category",
    "country_code",
    "state_code",
    "region",
    "city"
]

for column in categorical_columns:
    X[column] = (
        X[column]
        .fillna("Unknown")
        .astype(str)
        .str.strip()
    )

    X[column] = X[column].replace("", "Unknown")


# ============================================================
# 10. CLEAN NUMERICAL FEATURES
# ============================================================

numerical_columns = [
    "funding_total_usd",
    "funding_rounds",
    "startup_age",
    "years_to_first_funding",
    "funding_per_round"
]

for column in numerical_columns:

    X[column] = pd.to_numeric(
        X[column],
        errors="coerce"
    )

    X[column] = X[column].replace(
        [np.inf, -np.inf],
        np.nan
    )

    X[column] = X[column].fillna(
        X[column].median()
    )


# ============================================================
# 11. TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# ============================================================
# 12. SAVE PROCESSED DATA
# ============================================================

X_train.to_csv(
    PROCESSED_DIR / "X_train.csv",
    index=False
)

X_test.to_csv(
    PROCESSED_DIR / "X_test.csv",
    index=False
)

y_train.to_csv(
    PROCESSED_DIR / "y_train.csv",
    index=False
)

y_test.to_csv(
    PROCESSED_DIR / "y_test.csv",
    index=False
)


# ============================================================
# 13. SAVE COMPLETE CLEAN DATASET
# ============================================================

processed_df = X.copy()
processed_df["target"] = y.values

processed_df.to_csv(
    PROCESSED_DIR / "startup_processed.csv",
    index=False
)


# ============================================================
# 14. PRINT SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("PREPROCESSING COMPLETED")
print("=" * 60)

print(f"\nOriginal dataset: {df.shape}")
print(f"Feature dataset:  {X.shape}")

print(f"\nTraining samples: {X_train.shape[0]}")
print(f"Testing samples:  {X_test.shape[0]}")

print("\nTraining target distribution:")
print(y_train.value_counts())

print("\nTesting target distribution:")
print(y_test.value_counts())

print("\nFeatures used:")
for feature in feature_columns:
    print(f"  - {feature}")

print("\nSaved files:")

print(f"  {PROCESSED_DIR / 'X_train.csv'}")
print(f"  {PROCESSED_DIR / 'X_test.csv'}")
print(f"  {PROCESSED_DIR / 'y_train.csv'}")
print(f"  {PROCESSED_DIR / 'y_test.csv'}")
print(f"  {PROCESSED_DIR / 'startup_processed.csv'}")

print("\nPreprocessing finished successfully.")
# ```

# ### Run it

# From your current folder:

# ```powershell
# python ml/preprocess.py
# ```

# You should get output roughly like:

# ```text
# Loading dataset...
# Original dataset shape: (66368, 14)

# Target distribution:
# target
# 1    7096
# 0    6238

# ...

# ============================================================
# PREPROCESSING COMPLETED
# ============================================================

# Training samples: 10667
# Testing samples: 2667

# Features used:
#   - primary_category
#   - funding_total_usd
#   - country_code
#   - state_code
#   - region
#   - city
#   - funding_rounds
#   - startup_age
#   - years_to_first_funding
#   - funding_per_round

# Preprocessing finished successfully.
# ```

# The exact numbers should come from your dataset rather than being hardcoded.

# After it runs, your structure will become:

# ```text
# StartupPulse/
# │
# ├── data/
# │   ├── big_startup_secsees_dataset.csv
# │   │
# │   └── processed/
# │       ├── X_train.csv
# │       ├── X_test.csv
# │       ├── y_train.csv
# │       ├── y_test.csv
# │       └── startup_processed.csv
# │
# ├── ml/
# │   ├── eda.py
# │   └── preprocess.py
# │
# └── venv/
# ```

# **Important:** this script performs the data preparation, but it does **not** one-hot encode the categorical variables yet. We'll do that inside the ML pipeline so the exact same preprocessing can later be applied to a startup submitted through the FastAPI frontend.

# Run it and send me the complete output. Then we'll build **`ml/train.py`** and train Logistic Regression, Random Forest, and XGBoost on the same split.
