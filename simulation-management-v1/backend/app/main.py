from fastapi import FastAPI
from models.simulation import Simulation
from models.user import User
from fastapi import HTTPException
from utils.database import get_mongo_client

app = FastAPI()

client = get_mongo_client()
db = client["simulation_management_db"]
simulations_collection = db["simulations"]
users_collection=db["users"]

@app.get("/")
async def read_root():
    return {"message": "Niv kelman and Eden Ovad test"}



