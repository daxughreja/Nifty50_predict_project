import os
import sys
import pickle
import datetime
import logging
import pandas as pd
import numpy as np

# Apply pickle patch for GradientBoosting / HistGradientBoosting compatibility across scikit-learn versions
try:
    import sklearn
    import sklearn._loss._loss
    sys.modules['_loss'] = sklearn._loss._loss
except Exception:
    pass

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Setup logger to write directly to uvicorn console
logger = logging.getLogger("uvicorn")

# Global variables for models, dataset, and performance cache
models = {}
model_errors = {}
df = None
data_error = None
performance_cache = None

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "new_data.csv")

MODEL_DEFINITIONS = [
    {"id": "LinearRegression", "name": "Linear Regression", "file": "LinearRegression.pkl", "fallback": "linear_regression_model.pkl"},
    {"id": "Ridge", "name": "Ridge Regression", "file": "Ridge.pkl"},
    {"id": "Lasso", "name": "Lasso Regression", "file": "Lasso.pkl"},
    {"id": "ElasticNet", "name": "Elastic Net", "file": "ElasticNet.pkl"},
    {"id": "DecisionTree", "name": "Decision Tree", "file": "DecisionTree.pkl"},
    {"id": "RandomForest", "name": "Random Forest", "file": "RandomForest.pkl"},
    {"id": "ExtraTrees", "name": "Extra Trees", "file": "ExtraTrees.pkl"},
    {"id": "GradientBoosting", "name": "Gradient Boosting", "file": "GradientBoosting.pkl"},
    {"id": "HistGradientBoosting", "name": "Hist Gradient Boosting", "file": "HistGradientBoosting.pkl"},
    {"id": "SVR", "name": "SVR", "file": "SVR.pkl"},
]

def compute_all_model_performance():
    """Calculates real evaluation metrics (RSS, RMSE, R2, MAE, MAPE, Directional Accuracy) for all loaded models using 80/20 train/test split."""
    global performance_cache
    if not models or df is None:
        return None

    try:
        cols = {c.lower(): c for c in df.columns}
        open_col = cols.get("open", "open")
        high_col = cols.get("high", "high")
        low_col = cols.get("low", "low")
        close_col = cols.get("close", "close")
        target_col = cols.get("tomorrow_close", "Tomorrow_Close")
        date_col = cols.get("date", "date")

        X_all = df[[open_col, low_col, high_col, close_col]]
        y_all = df[target_col]

        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(
            X_all, y_all, test_size=0.2, random_state=42
        )

        test_indices = y_test.index
        close_ref = df[close_col].iloc[test_indices]
        dates_test = df[date_col].iloc[test_indices] if date_col in df else pd.Series(range(len(test_indices)))

        ss_tot = float(np.sum((y_test - np.mean(y_test)) ** 2))

        model_results = []
        chart_records = []

        for m_def in MODEL_DEFINITIONS:
            m_id = m_def["id"]
            if m_id not in models:
                continue

            m_obj = models[m_id]
            feat_in = getattr(m_obj, "feature_names_in_", None)
            
            if feat_in is not None:
                # Format features into DataFrame matching exact feature_names_in_
                X_eval = pd.DataFrame(
                    X_test.values,
                    columns=["open", "low", "high", "close"]
                )[list(feat_in)]
            else:
                X_eval = X_test

            y_pred = m_obj.predict(X_eval)

            ss_res = float(np.sum((y_test.values - y_pred) ** 2))
            r2 = float(1 - (ss_res / ss_tot)) if ss_tot > 0 else 0.0
            rmse = float(np.sqrt(np.mean((y_test.values - y_pred) ** 2)))
            mae = float(np.mean(np.abs(y_test.values - y_pred)))
            mape = float(np.mean(np.abs((y_test.values - y_pred) / y_test.values)) * 100)

            actual_dir = np.sign(y_test.values - close_ref.values)
            pred_dir = np.sign(y_pred - close_ref.values)
            dir_acc = float(np.mean(actual_dir == pred_dir) * 100)

            model_results.append({
                "id": m_id,
                "name": m_def["name"],
                "rss": round(ss_res, 2),
                "rmse": round(rmse, 2),
                "r2": round(r2, 6),
                "r2_percent": round(r2 * 100, 4),
                "mae": round(mae, 2),
                "mape": round(mape, 2),
                "directional_accuracy": round(dir_acc, 2)
            })

            # Generate chart samples for the primary/best model
            if m_id in ["LinearRegression", "Lasso", "RandomForest"] and not chart_records:
                sample_count = min(100, len(y_test))
                for i in range(len(y_test) - sample_count, len(y_test)):
                    act_val = float(y_test.iloc[i])
                    prd_val = float(y_pred[i])
                    ref_val = float(close_ref.iloc[i])
                    date_val = str(dates_test.iloc[i])
                    err_val = float(act_val - prd_val)
                    
                    act_d = 1 if act_val > ref_val else (-1 if act_val < ref_val else 0)
                    prd_d = 1 if prd_val > ref_val else (-1 if prd_val < ref_val else 0)

                    chart_records.append({
                        "date": date_val,
                        "reference_close": round(ref_val, 2),
                        "actual_close": round(act_val, 2),
                        "predicted_close": round(prd_val, 2),
                        "error": round(err_val, 2),
                        "direction_correct": bool(act_d == prd_d)
                    })

        # Sort models by highest R2 score descending to assign dynamic ranks
        model_results.sort(key=lambda item: item["r2"], reverse=True)
        for idx, item in enumerate(model_results):
            item["rank"] = idx + 1

        best_model = model_results[0] if model_results else None

        performance_cache = {
            "models": model_results,
            "best_model": best_model,
            "evaluation": {
                "target": "Tomorrow_Close",
                "features": ["open", "low", "high", "close"],
                "test_size": 0.2,
                "random_state": 42,
                "total_samples": len(df),
                "test_samples": len(y_test)
            },
            "chart_data": chart_records,
            # Legacy metrics mapping for backward compatibility
            "r2_score": best_model["r2"] if best_model else 0.0,
            "mae": best_model["mae"] if best_model else 0.0,
            "rmse": best_model["rmse"] if best_model else 0.0,
            "mape": best_model["mape"] if best_model else 0.0,
            "directional_accuracy": best_model["directional_accuracy"] if best_model else 0.0,
            "test_samples_count": len(y_test),
            "total_samples_count": len(df),
            "methodology": "80/20 train/test split evaluation (random_state=42) on new_data.csv"
        }

        logger.info(f"Multi-model performance metrics computed successfully for {len(model_results)} models. Best model: {best_model['name']} (R2={best_model['r2']:.6f})")
        return performance_cache
    except Exception as e:
        logger.error(f"Failed to compute multi-model performance metrics: {str(e)}")
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global models, model_errors, df, data_error

    logger.info("--------------------------------------------------")
    logger.info("Initializing Nifty 50 Multi-Model AI Predictor lifespan...")

    # 1. Load trained pickle models
    for m_def in MODEL_DEFINITIONS:
        m_id = m_def["id"]
        primary_path = os.path.join(MODEL_DIR, m_def["file"])
        fallback_path = os.path.join(MODEL_DIR, m_def.get("fallback", "")) if m_def.get("fallback") else None

        model_file = None
        if os.path.exists(primary_path):
            model_file = primary_path
        elif fallback_path and os.path.exists(fallback_path):
            model_file = fallback_path

        if not model_file:
            err_msg = f"Model file not found for {m_id} at {primary_path}"
            model_errors[m_id] = err_msg
            logger.warning(err_msg)
            continue

        try:
            with open(model_file, "rb") as f:
                loaded_model = pickle.load(f)
            models[m_id] = loaded_model
            logger.info(f"Model [{m_id}] ({m_def['name']}) loaded successfully from {os.path.basename(model_file)}.")
        except Exception as e:
            err_msg = f"Failed to load model [{m_id}]: {str(e)}"
            model_errors[m_id] = err_msg
            logger.error(err_msg)

    # 2. Load dataset
    logger.info(f"Loading dataset file: {DATA_PATH}")
    if not os.path.exists(DATA_PATH):
        data_error = f"CSV dataset not found at {DATA_PATH}."
        logger.error(data_error)
    else:
        try:
            df = pd.read_csv(DATA_PATH)
            df.columns = [c.strip() for c in df.columns]
            logger.info(f"Dataset loaded successfully with {len(df)} records.")
        except Exception as e:
            data_error = f"Failed to load dataset: {str(e)}"
            logger.error(data_error)

    # Compute performance metrics cache
    if models and df is not None:
        compute_all_model_performance()

    logger.info(f"Startup sequence finished. Total models active: {len(models)}/{len(MODEL_DEFINITIONS)}")
    logger.info("--------------------------------------------------")
    yield
    logger.info("Shutting down lifespan context...")

app = FastAPI(
    title="Nifty 50 Multi-Model AI Stock Price Predictor API",
    description="Production API for predicting Nifty 50 closing prices using 10 trained machine learning regression models.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://nifty50-ai.vercel.app",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionInput(BaseModel):
    model: str = Field(default="LinearRegression", description="ID of the trained model to use", example="LinearRegression")
    open: float = Field(..., description="Opening price of the stock", example=12000.0)
    high: float = Field(..., description="Highest price of the stock during the day", example=12100.0)
    low: float = Field(..., description="Lowest price of the stock during the day", example=11900.0)
    close: float = Field(..., description="Closing price of the stock", example=12050.0)

    class Config:
        json_schema_extra = {
            "example": {
                "model": "LinearRegression",
                "open": 12000.0,
                "high": 12100.0,
                "low": 11900.0,
                "close": 12050.0
            }
        }

def check_data_loaded():
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Dataset is not loaded. {data_error or 'Please check server logs.'}"
        )

def check_models_loaded():
    if not models:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI models are loaded. Please check server logs."
        )

@app.get("/", status_code=status.HTTP_200_OK)
@app.get("/api", status_code=status.HTTP_200_OK)
@app.get("/api/", status_code=status.HTTP_200_OK)
@app.get("/api/health", status_code=status.HTTP_200_OK)
def read_root():
    """Health check endpoint containing multi-model status and dataset metadata."""
    return {
        "status": "online",
        "timestamp": datetime.datetime.now().isoformat(),
        "loaded_models_count": len(models),
        "total_models_count": len(MODEL_DEFINITIONS),
        "model_status": "loaded" if models else "failed",
        "failed_models": model_errors,
        "dataset_status": "loaded" if df is not None else "failed",
        "dataset_error": data_error,
        "features_required": ["open", "low", "high", "close"],
        "dataset_info": {
            "columns": list(df.columns) if df is not None else [],
            "records_count": len(df) if df is not None else 0
        } if df is not None else None
    }

@app.get("/api/models", status_code=status.HTTP_200_OK)
def get_models():
    """Returns list of available trained models with feature requirements."""
    check_models_loaded()
    result = []
    for m_def in MODEL_DEFINITIONS:
        m_id = m_def["id"]
        is_loaded = m_id in models
        m_obj = models.get(m_id)
        feat_in = list(getattr(m_obj, "feature_names_in_", ["open", "low", "high", "close"])) if m_obj else ["open", "low", "high", "close"]

        result.append({
            "id": m_id,
            "name": m_def["name"],
            "features": feat_in,
            "status": "loaded" if is_loaded else "failed",
            "error": model_errors.get(m_id)
        })
    return {
        "models": result,
        "total_count": len(MODEL_DEFINITIONS),
        "loaded_count": len(models)
    }

@app.get("/api/model-performance", status_code=status.HTTP_200_OK)
@app.get("/api/performance", status_code=status.HTTP_200_OK)
@app.get("/api/accuracy", status_code=status.HTTP_200_OK)
def get_model_performance():
    """Returns dynamic RSS, RMSE, and R2 performance metrics for all 10 trained models."""
    check_models_loaded()
    check_data_loaded()
    global performance_cache
    if performance_cache is None:
        performance_cache = compute_all_model_performance()
    if performance_cache is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate multi-model performance metrics."
        )
    return performance_cache

@app.post("/api/predict", status_code=status.HTTP_200_OK)
def predict(payload: PredictionInput):
    """
    Accepts model choice and daily stock metrics (open, high, low, close),
    executes prediction using the specified model's .pkl file, and returns predicted closing price.
    """
    check_models_loaded()

    # Validate model selection
    requested_model_id = payload.model.strip()
    
    # Case-insensitive lookup
    matched_model_id = None
    for m_def in MODEL_DEFINITIONS:
        if m_def["id"].lower() == requested_model_id.lower() or m_def["name"].lower() == requested_model_id.lower():
            matched_model_id = m_def["id"]
            break

    if not matched_model_id:
        matched_model_id = requested_model_id

    if matched_model_id not in models:
        available_list = [m["name"] for m in MODEL_DEFINITIONS if m["id"] in models]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Selected model '{payload.model}' is not loaded or available. Available models: {', '.join(available_list)}"
        )

    # Validate OHLC input logic
    if payload.low > payload.high:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validation Error: Low price cannot be greater than High price."
        )
    if payload.open <= 0 or payload.high <= 0 or payload.low <= 0 or payload.close <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validation Error: All stock prices must be positive values greater than zero."
        )

    try:
        selected_model = models[matched_model_id]
        model_name = next((m["name"] for m in MODEL_DEFINITIONS if m["id"] == matched_model_id), matched_model_id)

        # Inspect feature order expected by the model
        feat_in = getattr(selected_model, "feature_names_in_", None)
        
        # Build DataFrame with standard feature names
        X_df = pd.DataFrame(
            [[payload.open, payload.low, payload.high, payload.close]],
            columns=["open", "low", "high", "close"]
        )

        if feat_in is not None:
            # Reorder columns to respect model's exact feature_names_in_
            X_df = X_df[list(feat_in)]

        predicted_close_arr = selected_model.predict(X_df)
        predicted_close = float(predicted_close_arr[0])

        return {
            "model": matched_model_id,
            "model_name": model_name,
            "prediction": round(predicted_close, 2),
            "prediction_time": datetime.datetime.now().isoformat(),
            "inputs": {
                "open": payload.open,
                "high": payload.high,
                "low": payload.low,
                "close": payload.close
            }
        }
    except Exception as e:
        logger.error(f"Prediction error for model '{matched_model_id}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction service failure ({matched_model_id}): {str(e)}"
        )

@app.get("/api/latest", status_code=status.HTTP_200_OK)
def get_latest_record():
    """Returns the most recent stock record from the dataset."""
    check_data_loaded()
    try:
        latest_row = df.iloc[-1].to_dict()
        return {k: (None if pd.isna(v) else v) for k, v in latest_row.items()}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch latest record: {str(e)}"
        )

@app.get("/api/statistics", status_code=status.HTTP_200_OK)
def get_statistics():
    """Returns dataset statistics and numeric summary."""
    check_data_loaded()
    try:
        cols = {c.lower(): c for c in df.columns}
        close_col = cols.get("close", "close")
        open_col = cols.get("open", "open")
        high_col = cols.get("high", "high")
        low_col = cols.get("low", "low")

        stats = {
            "total_records": int(len(df)),
            "highest_close": float(df[close_col].max()) if close_col in df else None,
            "lowest_close": float(df[close_col].min()) if close_col in df else None,
            "average_close": float(df[close_col].mean()) if close_col in df else None,
            "average_open": float(df[open_col].mean()) if open_col in df else None,
            "average_high": float(df[high_col].mean()) if high_col in df else None,
            "average_low": float(df[low_col].mean()) if low_col in df else None,
            "total_models": len(MODEL_DEFINITIONS),
            "active_models": len(models)
        }
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate statistics: {str(e)}"
        )

@app.get("/api/chart", status_code=status.HTTP_200_OK)
def get_chart_data():
    """Returns the last 100 records for rendering charts."""
    check_data_loaded()
    try:
        last_100_df = df.tail(100).replace({np.nan: None})
        return last_100_df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chart data: {str(e)}"
        )
