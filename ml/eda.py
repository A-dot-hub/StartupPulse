import pandas as pd

# Load dataset in the system
df = pd.read_csv("data/big_startup_secsees_dataset.csv")

print("\n===== DATASET SHAPE =====")
print(df.shape)
print(df.shape)
print("\n===== COLUMN NAMES =====")
print(df.columns.tolist())

print("\n===== FIRST 5 ROWS =====")
print(df.head())

print("\n===== DATA TYPES =====")
print(df.dtypes)

print("\n===== MISSING VALUES =====")
print(df.isnull().sum())

print("\n===== DUPLICATE ROWS =====")
print(df.duplicated().sum())

print("\n===== TARGET DISTRIBUTION =====")
print(df["status"].value_counts())

print("\n===== STATISTICAL SUMMARY =====")
print(df.describe())