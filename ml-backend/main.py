from fastapi import FastAPI, HTTPException
import pandas as pd
from pydantic import BaseModel
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

app = FastAPI()

MODEL_PATH = "model.pkl"
DATA_PATH = "../Data.xlsx"

class PlayerStats(BaseModel):
    matches: int
    runs: int
    wickets: int

class TrainResponse(BaseModel):
    message: str
    r2_score: float

@app.post("/train")
def train_model():
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail="Data file not found")
        
    # Example training logic assuming Data.xlsx has Matches, Runs, Wickets and Price
    try:
        df = pd.read_excel(DATA_PATH)
        # Check standard columns
        required_cols = ["Matches", "Runs", "Wickets", "Price"]
        if not all(col in df.columns for col in required_cols):
            # Try lowercase
            df.columns = [c.capitalize() for c in df.columns]
            
        X = df[["Matches", "Runs", "Wickets"]]
        y = df["Price"]
        
        model = RandomForestRegressor(n_estimators=100)
        model.fit(X, y)
        
        joblib.dump(model, MODEL_PATH)
        return {"message": "Model trained successfully", "r2_score": round(model.score(X, y), 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
def predict_price(stats: PlayerStats):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=400, detail="Model not trained yet. Call /train first.")
        
    model = joblib.load(MODEL_PATH)
    try:
        input_data = pd.DataFrame([{"Matches": stats.matches, "Runs": stats.runs, "Wickets": stats.wickets}])
        prediction = model.predict(input_data)[0]
        return {"predicted_price": round(prediction, 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
