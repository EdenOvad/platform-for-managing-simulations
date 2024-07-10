from fastapi import FastAPI, Request, APIRouter
from flooddns.external.simulation.main import local_run
# from flooddns.external.jobs_generator.main import gen_ddp_pairs_different_sizes
from models.simulation import SimulationPayload, TemporyPayload
import os
import pandas as pd
import subprocess
from schemas.simulation import deleteSimulation, popSimulation, insertSimulation, update_simulation_db, popResults
from datetime import datetime
import random
from bson.objectid import ObjectId
from flooddns.external.schemas.routing import Routing

router = APIRouter()


@router.post("/simulate_flood_dns")
async def run_simulation(request: Request):
    payload = await request.json()
    payload_data = SimulationPayload(
        simulation_name=payload['params']['simulation_name'],
        num_jobs=payload['params']['num_jobs'],
        num_tors=payload['params']['num_tors'],
        n_cores=payload['params']['num_cores'],
        ring_size=payload['params']['ring_size'],
        routing=payload['params']['routing'],
        path=payload['params']['path'],
        seed=payload['params']['seed']
    )
    simulation_data = TemporyPayload(
        simulation_name=payload['params']['simulation_name'],
        num_jobs=payload['params']['num_jobs'],
        num_tors=payload['params']['num_tors'],
        n_cores=payload['params']['num_cores'],
        ring_size=payload['params']['ring_size'],
        routing=payload['params']['routing'],
        path=payload['params']['path'],
        seed=payload['params']['seed']
    )

    start_time = datetime.now()
    result = await local_run(
        num_jobs=payload_data.num_jobs,
        num_tors=payload_data.num_tors,
        n_cores=payload_data.n_cores,
        ring_size=payload_data.ring_size,
        routing=payload_data.routing,
        seed=payload_data.seed
    )
    end_time = datetime.now()
    # check if parameters allow
    print(result)
    if result == "You can`t create simulation with your parameters":
        print(result)
        current_date = datetime.today().strftime('%Y-%m-%d')

        simulation = {
            "simulation_name": str(simulation_data.simulation_name),
            "path": "",
            "date": current_date,
            "params": str(payload_data.num_jobs) + "," + str(payload_data.n_cores) + "," + str(payload_data.ring_size) + "," + str(payload_data.routing) + "," + str(payload_data.seed),
            "user_id": str(payload['user_id']),
            "result": result,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        await insertSimulation(simulation)
        simulations1 = await popSimulation(str(payload['user_id']))
        return {"data": simulations1, "progress": result}

    job_info_path = os.path.join(".", "flooddns", "runs", f"seed_{seed}", f"concurrent_jobs_{payload_data.num_jobs}",
                                 f"{payload_data.n_cores}_core_failures", f"ring_size_{payload_data.ring_size}", payload_data.routing, "logs_floodns", "job_info.csv")
    job_path = os.path.join(".", "flooddns", "runs", f"seed_{seed}", f"concurrent_jobs_{payload_data.num_jobs}",
                            f"{payload_data.n_cores}_core_failures", f"ring_size_{payload_data.ring_size}", payload_data.routing)
    job_info_path = job_info_path.replace("\\", "/")
    job_path = job_path.replace("\\", "/")
    job_info = pd.read_csv(job_info_path, header=None)
    if job_info.empty:
        print("No jobs found.")
        return
    job_csv = os.path.join(".", "flooddns", "runs",
                           "headers", "job_info.header")
    job_columns = pd.read_csv(job_csv)
    job_info.coulmns = job_columns.columns
    current_date = datetime.today().strftime('%Y-%m-%d')

    simulation = {
        "simulation_name": str(simulation_data.simulation_name),
        # "datas":list(datas),
        "path": job_path,
        "date": current_date,
        "params": str(payload_data.num_jobs) + "," + str(payload_data.n_cores) + "," + str(payload_data.ring_size) + "," + str(payload_data.routing),
        "user_id": str(payload['user_id']),
        "result": result
    }
    await insertSimulation(simulation)
    simulations1 = await popSimulation(str(payload['user_id']))
    return {"data": simulations1, "progress": result, "tempID": payload["params"]["tempID"]}


@router.post("/simulation_update")
async def update_simulation(request: Request):
    payload = await request.json()
    seed = random.choice([0, 42, 200, 404, 1234])
    payload_data = SimulationPayload(
        simulation_name=payload['params']['simulation_name'],
        num_jobs=payload['params']['num_jobs'],
        num_tors=payload['params']['num_tors'],
        n_cores=payload['params']['num_cores'],
        ring_size=payload['params']['ring_size'],
        routing=payload['params']['routing'],
        path=payload['params']['path'],
        seed=seed
    )
    simulation_data = TemporyPayload(
        simulation_name=payload['params']['simulation_name'],
        num_jobs=payload['params']['num_jobs'],
        num_tors=payload['params']['num_tors'],
        n_cores=payload['params']['num_cores'],
        ring_size=payload['params']['ring_size'],
        routing=payload['params']['routing'],
        path=payload['params']['path'],
        seed=seed
    )
    # send to object the main function with the parameters
    result = await local_run(
        num_jobs=payload_data.num_jobs,
        num_tors=payload_data.num_tors,
        n_cores=payload_data.n_cores,
        ring_size=payload_data.ring_size,
        routing=payload_data.routing,
        seed=seed
    )
    # check if result
    print(result)
    if (result == "You can`t create simulation with your parameters"):
        current_date = datetime.today().strftime('%Y-%m-%d')

        simulation = {
            "simulation_name": str(simulation_data.simulation_name),
            # "datas":list(datas),
            "path": "",
            "date": current_date,
            "params": str(payload_data.num_jobs) + "," + str(payload_data.n_cores) + "," + str(payload_data.ring_size) + "," + str(payload_data.routing),
            "user_id": str(payload['user_id']),
            "result": result
        }
        await update_simulation_db(simulation, payload['simulationID'], payload["user_id"])
        simulations1 = await popSimulation(str(payload['user_id']))
        return simulations1

    job_info_path = os.path.join(".", "flooddns", "runs", f"seed_{seed}", f"concurrent_jobs_{payload_data.num_jobs}",
                                 f"{payload_data.n_cores}_core_failures", f"ring_size_{payload_data.ring_size}", payload_data.routing, "logs_floodns", "job_info.csv")
    job_path = os.path.join(".", "flooddns", "runs", f"seed_{seed}", f"concurrent_jobs_{payload_data.num_jobs}",
                            f"{payload_data.n_cores}_core_failures", f"ring_size_{payload_data.ring_size}", payload_data.routing)
    job_info_path = job_info_path.replace("\\", "/")
    job_path = job_path.replace("\\", "/")
    job_info = pd.read_csv(job_info_path, header=None)
    if job_info.empty:
        print("No jobs found.")
        return
    job_csv = os.path.join(".", "flooddns", "runs",
                           "headers", "job_info.header")
    job_columns = pd.read_csv(job_csv)
    job_info.coulmns = job_columns.columns
    current_date = datetime.today().strftime('%Y-%m-%d')

    simulation = {
        "simulation_name": str(simulation_data.simulation_name),
        # "datas":list(datas),
        "path": job_path,
        "date": current_date,
        "params": str(payload_data.num_jobs) + "," + str(payload_data.n_cores) + "," + str(payload_data.ring_size) + "," + str(payload_data.routing),
        "user_id": str(payload['user_id']),
        "result": result
    }
    await update_simulation_db(simulation, payload['simulationID'], payload["user_id"])
    simulations1 = await popSimulation(str(payload['user_id']))
    return simulations1


@router.post("/re_run_simulation")
async def re_run_simulation(request: Request):
    params = await request.json()
    payload = params['data']
    process = subprocess.Popen(["java", "-jar", "./flooddns/floodns-basic-sim.jar",
                               payload], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, _ = process.communicate()
    output = output.decode('utf-8')
    return output


@router.post("/get_simulate_flood_dns")
async def get_simulation(request: Request):
    user_id = await request.json()
    simulations1 = await popSimulation(user_id['state'])
    return simulations1


@router.post("/delte_simulation")
async def delte_simulation(request: Request):
    params = await request.json()
    payload = params['data']
    await deleteSimulation({"_id": ObjectId(payload)})
    simulations1 = await popSimulation(str(params['user_id']))
    return simulations1


@router.post("/show_result")
async def show_results(request: Request):
    payload = await request.json()
    result = await popResults(str(payload["user_id"]), str(payload['data']))
    return result
