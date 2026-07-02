# HawaGuide – Hyperlocal AQI Safety Platform

> AI-powered hyperlocal air quality forecasting and personalized outdoor safety recommendations using satellite data, spatial interpolation, and machine learning.

<p align="center">
  <p align="center">
  <img src="Screenshot%202026-06-27%20163501.png" width="100%" alt="HawaGuide Dashboard">
</p>
</p>

<p align="center">
  <a href="https://hawa-guide-hyperlocal-aqi-safety-pl.vercel.app"><strong>Live Demo</strong></a> •
  <a href="#features"><strong>Features</strong></a> •
  <a href="#architecture"><strong>Architecture</strong></a> •
  <a href="#technology-stack"><strong>Tech Stack</strong></a>
</p>

---

## Overview

HawaGuide is an AI-powered environmental intelligence platform designed to help users identify the safest outdoor locations in Delhi based on predicted air quality and personalized health risk.

Unlike conventional AQI applications that rely solely on nearby monitoring stations, HawaGuide generates **hyperlocal pollution estimates** for **50+ Delhi green spaces** using satellite-derived environmental data, spatial interpolation techniques, and machine learning forecasting models.

The platform introduces **PEVI (Personalized Exposure Vulnerability Index)**, a health-aware metric that combines multiple pollutants with demographic and medical factors to recommend safer outdoor destinations.

---

## Features

- Hyperlocal AQI prediction across **50+ Delhi green spaces**
- Hourly pollution estimation using **Kriging** and **Gaussian Process Regression (GPR)**
- **6-hour air quality forecasting** using an ensemble of:
  - XGBoost
  - LSTM
  - Prophet
- Personalized exposure assessment using:
  - Age group
  - Health condition
  - Outdoor duration
- Multi-objective optimization balancing:
  - Air quality
  - Travel distance
- Interactive cyber-terminal inspired dashboard
- Real-time recommendation engine

---

## Dashboard

The application provides:

- Personalized environmental exposure analysis
- Forecasted pollution trends
- Interactive optimization slider
- Green-space ranking
- Health-aware recommendations
- System monitoring interface

---

## PEVI (Personalized Exposure Vulnerability Index)

Traditional AQI represents environmental conditions but does not account for individual health differences.

HawaGuide introduces **PEVI**, a weighted health-aware exposure metric that combines:

- PM2.5
- PM10
- NO₂
- O₃
- CO

The score is adjusted based on:

- Age group
- Health condition
- Outdoor exposure duration

This enables personalized outdoor recommendations instead of generic AQI values.

---

## Machine Learning Pipeline

### Spatial Estimation

- Kriging Interpolation
- Gaussian Process Regression (GPR)

Used to estimate pollution levels across regions without monitoring stations.

### Forecasting

An ensemble model combines:

- XGBoost
- LSTM
- Prophet

to generate **6-hour forecasts** with **<8% Mean Absolute Percentage Error (MAPE).**

---

## Multi-Objective Optimization

Recommendations are generated using:

```
Score = α × Risk + (1 − α) × Distance
```

where

- α = 0 → Prioritize shortest travel distance
- α = 1 → Prioritize safest air quality

Users can dynamically adjust this trade-off through the interface.

---

## Architecture

```
Satellite Data
      │
      ▼
Spatial Interpolation
(Kriging + GPR)
      │
      ▼
Hyperlocal AQI Maps
      │
      ▼
Feature Engineering
      │
      ▼
Forecasting Ensemble
(XGBoost + LSTM + Prophet)
      │
      ▼
PEVI Calculation
      │
      ▼
Multi-Objective Optimization
      │
      ▼
Interactive Dashboard
```

---

## Technology Stack

### Frontend

- React
- Tailwind CSS
- Framer Motion
- Recharts

### Backend

- FastAPI
- Python

### Machine Learning

- XGBoost
- TensorFlow / Keras
- Prophet
- Scikit-learn

### Geospatial Processing

- PyKrige
- Gaussian Process Regression
- GeoPandas
- Rasterio

### Data Processing

- Pandas
- NumPy

### Deployment

- Vercel
- GitHub

---

## Performance

| Metric | Value |
|----------|--------|
| Coverage | 50+ Delhi Green Spaces |
| Refresh Rate | Hourly |
| Forecast Horizon | 6 Hours |
| Forecast Accuracy | <8% MAPE |
| Pollutants | PM2.5, PM10, NO₂, O₃, CO |
| Personalization | 4 Age Groups × 3 Health Conditions |

---

## Live Demo

**https://hawa-guide-hyperlocal-aqi-safety-pl.vercel.app**

---

## Future Improvements

- Multi-city support
- IoT sensor integration
- Route-level exposure optimization
- Mobile application
- Real-time traffic-aware forecasting
- Satellite data automation
- Wearable device integration

---

## Patent

**PEVI – Personalized Exposure Vulnerability Index**

Patent filed in **April 2026** for a health-aware multi-pollutant environmental exposure metric designed to personalize outdoor safety recommendations.

---

## License

This project is intended for research, academic, and demonstration purposes.
