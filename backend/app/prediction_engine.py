import pandas as pd
import numpy as np

def predict_future(df, date):
    df = df.copy()

    # Convert timestamp
    df["datetime"] = pd.to_datetime(df["datetime"])

    # Extract features
    df["hour"] = df["datetime"].dt.hour
    df["dayofweek"] = df["datetime"].dt.dayofweek

    # Base pollution score
    df["pollution_score"] = (
        0.4 * df["pm25"] +
        0.3 * df["pm10"] +
        0.2 * df["no2"] +
        0.1 * df["co"]
    )

    # 🔥 Time-based pattern (rush hours = worse air)
    df["time_factor"] = df["hour"].apply(
        lambda x: 1.3 if 8 <= x <= 11 or 18 <= x <= 21 else 0.8
    )

    # 🔥 Weekend vs weekday
    df["day_factor"] = df["dayofweek"].apply(
        lambda x: 0.9 if x >= 5 else 1.1
    )

    # 🔥 Future simulation trend
    trend = np.sin(np.linspace(0, 3.14, len(df))) * 0.15

    df["predicted_pollution"] = (
        df["pollution_score"] *
        df["time_factor"] *
        df["day_factor"]
    )

    df["predicted_pollution"] *= (1 + trend)

    return df