"""
Model evaluation utilities for fake job detection.
"""
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, confusion_matrix
)


def evaluate_model(y_true, y_pred, model_name="Model"):
    """Evaluate a model and return metrics dict + print report."""
    metrics = {
        "model": model_name,
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "precision": round(precision_score(y_true, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_true, y_pred, zero_division=0), 4),
        "f1_score": round(f1_score(y_true, y_pred, zero_division=0), 4),
    }
    
    print(f"\n{'='*50}")
    print(f"  {model_name} Evaluation")
    print(f"{'='*50}")
    print(f"  Accuracy:  {metrics['accuracy']}")
    print(f"  Precision: {metrics['precision']}")
    print(f"  Recall:    {metrics['recall']}")
    print(f"  F1 Score:  {metrics['f1_score']}")
    print(f"\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=["Real", "Fake"]))
    print(f"Confusion Matrix:")
    print(confusion_matrix(y_true, y_pred))
    
    return metrics


def compare_models(results):
    """Compare multiple model results and return the best one by F1."""
    print(f"\n{'='*60}")
    print(f"  Model Comparison Summary")
    print(f"{'='*60}")
    print(f"  {'Model':<25} {'Accuracy':<12} {'F1 Score':<12}")
    print(f"  {'-'*49}")
    
    best = None
    for r in results:
        print(f"  {r['model']:<25} {r['accuracy']:<12} {r['f1_score']:<12}")
        if best is None or r['f1_score'] > best['f1_score']:
            best = r
    
    print(f"\n  ★ Best Model: {best['model']} (F1: {best['f1_score']})")
    return best
