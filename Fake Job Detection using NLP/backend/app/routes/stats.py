"""
Stats endpoint for analytics data.
"""
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import os

from app.database import get_db
from app.models import Prediction, FlaggedPost, ModelVersion
from app.auth import require_auth

router = APIRouter()

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'ml', 'models')


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Return analytics data for the dashboard."""
    
    total_predictions = db.query(Prediction).count()
    total_fake = db.query(Prediction).filter(Prediction.prediction == "Fake").count()
    total_real = db.query(Prediction).filter(Prediction.prediction == "Real").count()
    total_flagged = db.query(FlaggedPost).count()
    
    fake_percentage = round((total_fake / total_predictions * 100), 2) if total_predictions > 0 else 0
    
    # Daily stats for the last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_predictions = db.query(Prediction).filter(
        Prediction.created_at >= thirty_days_ago
    ).all()
    
    daily_map = defaultdict(lambda: {"date": "", "total": 0, "fake": 0, "real": 0})
    for p in recent_predictions:
        day = p.created_at.strftime("%Y-%m-%d")
        daily_map[day]["date"] = day
        daily_map[day]["total"] += 1
        if p.prediction == "Fake":
            daily_map[day]["fake"] += 1
        else:
            daily_map[day]["real"] += 1
    
    daily_stats = sorted(daily_map.values(), key=lambda x: x["date"])
    
    # Model info
    model_info = None
    meta_path = os.path.join(MODEL_DIR, 'model_metadata.json')
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            model_info = json.load(f)
    
    return {
        "total_predictions": total_predictions,
        "total_fake": total_fake,
        "total_real": total_real,
        "fake_percentage": fake_percentage,
        "total_flagged": total_flagged,
        "daily_trend": daily_stats,
        "model_info": model_info
    }


@router.get("/predictions")
async def get_predictions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Return paginated prediction logs."""
    predictions = db.query(Prediction).order_by(
        Prediction.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for p in predictions:
        flagged = db.query(FlaggedPost).filter(FlaggedPost.prediction_id == p.id).first()
        result.append({
            "id": p.id,
            "job_text": p.job_text[:200] + "..." if len(p.job_text) > 200 else p.job_text,
            "prediction": p.prediction,
            "confidence": round(p.confidence * 100, 2) if p.confidence <= 1 else p.confidence,
            "created_at": p.created_at.isoformat(),
            "is_flagged": flagged is not None,
            "flag_reason": flagged.reason if flagged else None
        })
    
    return {"predictions": result, "total": db.query(Prediction).count()}


@router.get("/my-predictions")
async def get_my_predictions(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(require_auth),
):
    """Return the current user's recent predictions."""
    predictions = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).order_by(
        Prediction.created_at.desc()
    ).offset(skip).limit(limit).all()

    result = []
    for p in predictions:
        result.append({
            "id": p.id,
            "job_text": p.job_text[:200] + "..." if len(p.job_text) > 200 else p.job_text,
            "prediction": p.prediction,
            "confidence": round(p.confidence * 100, 2) if p.confidence <= 1 else p.confidence,
            "created_at": p.created_at.isoformat(),
        })

    return {"predictions": result}
