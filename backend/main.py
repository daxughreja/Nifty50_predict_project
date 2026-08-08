import os
import pickle
import datetime
import logging
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Setup logger to write directly to uvicorn console
logger = logging.getLogger("uvicorn")

# Global variables for model and data
model = None
df = None
model_error = None
data_error = None

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "linear_regression_model.pkl")
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "new_data.csv")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, df, model_error, data_error
    
    logger.info("--------------------------------------------------")
    logger.info("Initializing Nifty 50 AI Stock Predictor lifespan...")
    
    # 1. Load the model
    logger.info(f"Loading model file: {MODEL_PATH}")
    if not os.path.exists(MODEL_PATH):
        model_error = f"Model file not found at {MODEL_PATH}."
        logger.error(model_error)
    else:
        try:
            with open(MODEL_PATH, "rb") as f:
                model = pickle.load(f)
            logger.info("Linear Regression pickle model loaded successfully.")
        except Exception as e:
            model_error = f"Failed to load model: {str(e)}"
            logger.error(model_error)

    # 2. Load the dataset
    logger.info(f"Loading dataset file: {DATA_PATH}")
    if not os.path.exists(DATA_PATH):
        data_error = f"CSV dataset not found at {DATA_PATH}."
        logger.error(data_error)
    else:
        try:
            df = pd.read_csv(DATA_PATH)
            # Clean column whitespace
            df.columns = [c.strip() for c in df.columns]
            logger.info(f"Dataset loaded successfully with {len(df)} records.")
            logger.info(f"Columns detected: {list(df.columns)}")
        except Exception as e:
            data_error = f"Failed to load dataset: {str(e)}"
            logger.error(data_error)
            
    logger.info("Startup sequence finished.")
    logger.info("--------------------------------------------------")
    yield
    logger.info("Shutting down lifespan context...")

app = FastAPI(
    title="Nifty 50 AI Stock Price Predictor API",
    description="Production-ready API for predicting Nifty 50 closing prices using an existing Linear Regression model.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input schema for prediction
class PredictionInput(BaseModel):
    open: float = Field(..., description="Opening price of the stock", example=1200.0)
    high: float = Field(..., description="Highest price of the stock during the day", example=1225.0)
    low: float = Field(..., description="Lowest price of the stock during the day", example=1180.0)
    close: float = Field(..., description="Closing price of the stock", example=1210.0)

    class Config:
        json_schema_extra = {
            "example": {
                "open": 1200.0,
                "high": 1225.0,
                "low": 1180.0,
                "close": 1210.0
            }
        }

# Helper to check if model and data are initialized
def check_data_loaded():
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Dataset is not loaded. {data_error or 'Please check server logs.'}"
        )

def check_model_loaded():
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model is not loaded. {model_error or 'Please check server logs.'}"
        )

@app.get("/", status_code=status.HTTP_200_OK)
@app.get("/api/health", status_code=status.HTTP_200_OK)
def read_root():
    """Health check endpoint containing model and dataset status."""
    return {
        "status": "online",
        "timestamp": datetime.datetime.now().isoformat(),
        "model_status": "loaded" if model is not None else "failed",
        "model_error": model_error,
        "dataset_status": "loaded" if df is not None else "failed",
        "dataset_error": data_error,
        "features_required": ["open", "high", "low", "close"],
        "dataset_info": {
            "columns": list(df.columns) if df is not None else [],
            "records_count": len(df) if df is not None else 0
        } if df is not None else None
    }

@app.get("/api/stock-data", status_code=status.HTTP_200_OK)
def get_stock_data():
    """Returns the complete dataset rows. Replaces any NaNs with None (JSON null) for clean JSON serialization."""
    check_data_loaded()
    try:
        cleaned_df = df.replace({np.nan: None})
        data = cleaned_df.to_dict(orient="records")
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process stock data: {str(e)}"
        )

@app.get("/api/latest", status_code=status.HTTP_200_OK)
def get_latest_record():
    """Returns the latest (most recent) stock record from the dataset."""
    check_data_loaded()
    try:
        latest_row = df.iloc[-1].to_dict()
        cleaned_row = {k: (None if pd.isna(v) else v) for k, v in latest_row.items()}
        return cleaned_row
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch latest record: {str(e)}"
        )

@app.get("/api/statistics", status_code=status.HTTP_200_OK)
def get_statistics():
    """Returns key metrics: Total Records, Highest Close, Lowest Close, Average Close, Average Open, Average High, Average Low, and other dynamically detected numeric statistics."""
    check_data_loaded()
    try:
        cols = {c.lower(): c for c in df.columns}
        
        close_col = cols.get("close", "close")
        open_col = cols.get("open", "open")
        high_col = cols.get("high", "high")
        low_col = cols.get("low", "low")
        volume_col = cols.get("volume", "volume") if "volume" in cols else None
        
        stats = {
            "total_records": int(len(df)),
            "highest_close": float(df[close_col].max()) if close_col in df else None,
            "lowest_close": float(df[close_col].min()) if close_col in df else None,
            "average_close": float(df[close_col].mean()) if close_col in df else None,
            "average_open": float(df[open_col].mean()) if open_col in df else None,
            "average_high": float(df[high_col].mean()) if high_col in df else None,
            "average_low": float(df[low_col].mean()) if low_col in df else None,
        }
        
        # Dynamic stats for all numerical columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        dynamic_stats = {}
        for col in numeric_cols:
            dynamic_stats[col] = {
                "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                "std": float(df[col].std()) if not pd.isna(df[col].std()) else None
            }
        
        stats["dynamic_stats"] = dynamic_stats
        stats["columns"] = list(df.columns)
        stats["has_volume"] = volume_col is not None
        
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate statistics: {str(e)}"
        )

@app.get("/api/chart", status_code=status.HTTP_200_OK)
def get_chart_data():
    """Returns the last 100 records of the stock dataset for rendering in charts."""
    check_data_loaded()
    try:
        last_100_df = df.tail(100).replace({np.nan: None})
        return last_100_df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chart data: {str(e)}"
        )

@app.post("/api/predict", status_code=status.HTTP_200_OK)
def predict(payload: PredictionInput):
    """
    Accepts daily stock metrics (open, high, low, close) in that exact order,
    runs the Linear Regression model, and returns the predicted tomorrow closing price.
    """
    check_model_loaded()
    
    # Validation checks
    if payload.low > payload.high:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validation Error: Low price cannot be greater than High price."
        )
    if payload.open <= 0 or payload.high <= 0 or payload.low <= 0 or payload.close <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validation Error: Prices must be positive values greater than zero."
        )

    try:
        input_features = [[payload.open, payload.high, payload.low, payload.close]]
        
        predicted_close_arr = model.predict(input_features)
        predicted_close = float(predicted_close_arr[0])

        return {
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction service failure: {str(e)}"
        )
