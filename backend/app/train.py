import pandas as pd
import xgboost as xgb
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "delhi_forecasting_dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "xgboost_pm25_model.json")

# Load dataset
df = pd.read_csv(DATA_PATH)

# --- DATETIME FEATURES ---
df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
df["hour"] = df["datetime"].dt.hour
df["day"] = df["datetime"].dt.day
df["month"] = df["datetime"].dt.month
df["day_of_week"] = df["datetime"].dt.dayofweek

# --- LOCATION ENCODING (CRITICAL FIX) ---
df["station_code"] = df["station"].astype("category").cat.codes

df = df.dropna()

# =========================
# 🔥 DATA AUGMENTATION (CONTROLLED)
# =========================
df = df.sample(n=min(2000, len(df)), random_state=42)

expanded_rows = []

for _, row in df.iterrows():
    for h in range(24):
        new_row = row.copy()

        # realistic pollution variation
        factor = 1 + 0.3 * np.sin(2 * np.pi * h / 24)

        new_row["hour"] = h
        new_row["pm25"] = row["pm25"] * factor
        new_row["pm10"] = row["pm10"] * factor
        new_row["no2"] = row["no2"] * factor
        new_row["o3"] = row["o3"] * factor

        expanded_rows.append(new_row)

df = pd.DataFrame(expanded_rows)

print("Expanded dataset size:", len(df))

# =========================
# FEATURES
# =========================
FEATURE_COLS = [
    "pm10", "no2", "o3", "co",
    "temperature", "humidity", "wind_speed",
    "hour", "day", "month", "day_of_week",
    "station_code"   # ✅ CRITICAL
]

X = df[FEATURE_COLS].apply(pd.to_numeric, errors="coerce").fillna(0)
y = df["pm25"]

# =========================
# TRAIN MODEL
# =========================
model = xgb.XGBRegressor(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05
)

model.fit(X, y)

# Save model
model.save_model(MODEL_PATH)

print("✅ Model retrained with LOCATION + TIME variation")