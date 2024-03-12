from pydantic import BaseModel

class Simulation(BaseModel):
    simulation_name: str
    user_id: str
    status: str
    progress: float
    created_in: str