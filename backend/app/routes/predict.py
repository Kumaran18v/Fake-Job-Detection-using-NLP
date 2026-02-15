"""
Prediction endpoint for job analysis.
"""
import os
import joblib
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Prediction
from app.schemas import PredictRequest, PredictResponse
from app.auth import get_current_user

import sys
# __file__ is in backend/app/routes/ → go up 3 levels to backend/
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BACKEND_DIR)
from ml.preprocess import preprocess_text

router = APIRouter()

# Model cache
_model = None
_vectorizer = None

MODEL_DIR = os.path.join(BACKEND_DIR, 'ml', 'models')


def get_model():
    global _model, _vectorizer
    if _model is None:
        model_path = os.path.join(MODEL_DIR, 'best_model.pkl')
        tfidf_path = os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl')
        if not os.path.exists(model_path) or not os.path.exists(tfidf_path):
            raise HTTPException(
                status_code=503,
                detail="Model not available. Please train the model first."
            )
        _model = joblib.load(model_path)
        _vectorizer = joblib.load(tfidf_path)
    return _model, _vectorizer


def reload_model():
    """Force reload model from disk."""
    global _model, _vectorizer
    _model = None
    _vectorizer = None
    return get_model()


@router.post("/predict", response_model=PredictResponse)
async def predict_job(
    request: PredictRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Analyze a job posting and predict if it's fake or real."""
    model, vectorizer = get_model()
    
    # Preprocess
    clean_text = preprocess_text(request.job_text)
    if not clean_text.strip():
        raise HTTPException(status_code=400, detail="Job text is empty after preprocessing")
    
    # Predict
    features = vectorizer.transform([clean_text])
    prediction_label = model.predict(features)[0]
    
    # Get confidence via predict_proba if available
    if hasattr(model, 'predict_proba'):
        probas = model.predict_proba(features)[0]
        confidence = float(max(probas))
    else:
        confidence = 0.85  # fallback
    
    result = "Fake" if prediction_label == 1 else "Real"
    
    # Log to database
    user_id = current_user.id if current_user else None
    prediction_record = Prediction(
        user_id=user_id,
        job_text=request.job_text[:5000],  # truncate for storage
        prediction=result,
        confidence=round(confidence, 4),
        created_at=datetime.now(timezone.utc)
    )
    db.add(prediction_record)
    db.commit()
    db.refresh(prediction_record)
    
    return PredictResponse(
        prediction=result,
        confidence=round(confidence * 100, 2),
        prediction_id=prediction_record.id,
        analyzed_at=prediction_record.created_at.isoformat()
    )
