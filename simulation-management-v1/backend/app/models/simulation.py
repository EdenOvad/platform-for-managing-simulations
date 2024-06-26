from pydantic import BaseModel, create_model


class TemporyPayload(BaseModel):
    simulation_name: str
    seed_number: int
    num_jobs: int
    num_tors: int
    num_cores: int
    ring_size: int
    routing: str


class User(BaseModel):
    username: str
    email: str
    password: str


class SimulationPayload(BaseModel):
    simulation_name: str
    seed_number: int
    num_jobs: int
    num_tors: int
    num_cores: int
    ring_size: int
    routing: str
