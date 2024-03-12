from fastapi import FastAPI
from models.simulation import Simulation
from fastapi import HTTPException
from utils.database import get_mongo_client
from main import simulations_collection

app = FastAPI()

@app.post("/simulations/")
def create_simulation(simulation: Simulation):
    try:
        # Insert the simulation data into the "simulations" collection
        result = simulations_collection.insert_one(simulation.dict())
        inserted_id = result.inserted_id
        return {"message": f"Simulation with ID {inserted_id} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/simulations/{simulation_id}")
def get_simulation(simulation_id: str):

    return Simulation

@app.put("/simulations/{simulation_id}")
def update_simulation(simulation_id: str, simulation: Simulation):
    return {"message": "Simulation updated successfully"}

@app.delete("/simulations/{simulation_id}")
def delete_simulation(simulation_id: str):

    return "Simulation deleted successfully"