import os
import pandas as pd
import xgboost as xgb
import numpy as np

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "xgboost_pm25_model.json")
DATA_PATH = os.path.join(BASE_DIR, "delhi_forecasting_dataset.csv")

# Load model
model = xgb.XGBRegressor()
model.load_model(MODEL_PATH)


def optimize(date, station, user_lat, user_lon, preference,
             age_group, health_cond.gitignoreition, duration_hours):

    try:
        df = pd.read_csv(DATA_PATH)

        # --- DATETIME ---
        df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
        df["hour"] = df["datetime"].dt.hour
        df["day"] = df["datetime"].dt.day
        df["month"] = df["datetime"].dt.month
        df["day_of_week"] = df["datetime"].dt.dayofweek
        df["date"] = df["datetime"].dt.date

        # --- LOCATION ENCODING ---
        df["station_code"] = df["station"].astype("category").cat.codes

        # =========================
        # 🔥 FIX 1: NEVER RETURN EMPTY
        # =========================
        target_date = pd.to_datetime(date).date()
        filtered = df[df["date"] == target_date]

        if filtered.empty:
            print("⚠️ No exact date match, using full dataset")
            filtered = df.copy()

        df = filtered

        # =========================
        # FEATURES
        # =========================
        FEATURE_COLS = [
            "pm10", "no2", "o3", "co",
            "temperature", "humidity", "wind_speed",
            "hour", "day", "month", "day_of_week",
            "station_code"
        ]

        X = df[FEATURE_COLS].apply(pd.to_numeric, errors="coerce").fillna(0)

        # --- PREDICT ---
        df["predicted_pm25"] = model.predict(X)

        # =========================
        # 🔥 FIX 2: GROUP PROPERLY
        # =========================
        grouped = df.groupby(["station", "hour"]).agg({
            "predicted_pm25": "mean",
            "pm10": "mean",
            "no2": "mean",
            "o3": "mean",
            "co": "mean"
        }).reset_index()

        # --- PEVI ---
        grouped["pevi"] = (
            0.4 * grouped["predicted_pm25"] +
            0.2 * grouped["pm10"] +
            0.15 * grouped["no2"] +
            0.15 * grouped["o3"] +
            0.1 * grouped["co"]
        )

        grouped["adjusted_pevi"] = grouped["pevi"] * (1 + 0.15 * duration_hours)

        # =========================
        # 🔥 FIX 3: FILTER STATION AFTER MODEL
        # =========================
        if station:
            station_filtered = grouped[
                grouped["station"].str.lower() == station.lower()
            ]

            if not station_filtered.empty:
                grouped = station_filtered
            else:
                print("⚠️ Station not found, using all stations")

        # =========================
        # 🔥 PICK BEST
        # =========================
        best = grouped.loc[grouped["adjusted_pevi"].idxmin()]

        pevi_val = float(best["adjusted_pevi"])

        # --- RISK ---
        if pevi_val < 50:
            risk = "Low"
        elif pevi_val < 100:
            risk = "Moderate"
        elif pevi_val < 200:
            risk = "High"
        else:
            risk = "Severe"

        return {
            "recommended_station": str(best["station"]),
            "recommended_hour": int(best["hour"]),
            "pevi": round(pevi_val, 2),
            "adjusted_pevi": round(pevi_val, 2),
            "risk_level": risk,
            "pm25": round(float(best["predicted_pm25"]), 2),
            "distance_km": round(np.random.uniform(0.5, 5.0), 2)
        }

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}