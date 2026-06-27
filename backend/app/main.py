from fastapi import FastAPI
from sqlalchemy import func
from .database import engine, SessionLocal
from .models import Base, ExposureLog
from .optimization_engine import optimize
from fastapi.middleware.cors import CORSMiddleware

# 1️⃣ Create app FIRST
app = FastAPI()

# 2️⃣ Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3️⃣ Create tables
Base.metadata.create_all(bind=engine)


# 4️⃣ Routes AFTER app is created
@app.get("/")
def root():
    return {"message": "Backend Running"}


# ✅ FIXED OPTIMIZE ROUTE
@app.get("/optimize")
def optimize_route(
    date: str,
    station: str = "",   # optional (prevents 422)
    user_lat: float = 0.0,
    user_lon: float = 0.0,
    preference: float = 0.7,
    age_group: str = "adult",
    health_condition: str = "healthy",
    duration_hours: int = 1
):
    return optimize(
        date,
        station,
        user_lat,
        user_lon,
        preference,
        age_group,
        health_condition,
        duration_hours
    )


@app.get("/user-exposure-summary")
def exposure_summary(user_id: str = "anonymous_user"):
    db = SessionLocal()

    total = db.query(ExposureLog).filter(
        ExposureLog.user_id == user_id
    ).count()

    avg_pevi = db.query(func.avg(ExposureLog.pevi_score)).filter(
        ExposureLog.user_id == user_id
    ).scalar()

    most_station = db.query(
        ExposureLog.station,
        func.count(ExposureLog.station).label("count")
    ).filter(
        ExposureLog.user_id == user_id
    ).group_by(
        ExposureLog.station
    ).order_by(
        func.count(ExposureLog.station).desc()
    ).first()

    risk_counts = db.query(
        ExposureLog.risk_level,
        func.count(ExposureLog.risk_level)
    ).filter(
        ExposureLog.user_id == user_id
    ).group_by(
        ExposureLog.risk_level
    ).all()

    db.close()

    return {
        "total_exposures": total,
        "average_pevi": round(avg_pevi, 2) if avg_pevi else 0,
        "most_visited_station": most_station[0] if most_station else None,
        "risk_distribution": dict(risk_counts)
    }


@app.get("/feature-importance")
def feature_importance():
    from .optimization_engine import model

    if model is None:
        return {"error": "Model not loaded"}

    booster = model.get_booster()
    importance = booster.get_score(importance_type="weight")

    return {"feature_importance": importance}


@app.get("/pevi-trend")
def pevi_trend():
    from .database import SessionLocal
    from .models import ExposureLog
    from sqlalchemy import func

    db = SessionLocal()

    results = (
        db.query(
            ExposureLog.date,
            func.avg(ExposureLog.pevi_score).label("avg_pevi")
        )
        .group_by(ExposureLog.date)
        .order_by(ExposureLog.date)
        .all()
    )

    db.close()

    trend = [{"date": r.date, "avg_pevi": float(r.avg_pevi)} for r in results]

    return {"trend": trend}


@app.get("/download-report")
def download_report():
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.pagesizes import letter
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    from .database import SessionLocal
    from .models import ExposureLog

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    db = SessionLocal()
    logs = db.query(ExposureLog).all()
    db.close()

    elements.append(Paragraph("Exposure Report Summary", styles["Heading1"]))
    elements.append(Spacer(1, 12))

    data = [["Date", "Station", "PEVI", "Risk"]]

    for log in logs:
        data.append([
            str(log.date),
            log.station,
            str(log.pevi_score),
            log.risk_level
        ])

    table = Table(data)
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="application/pdf")