from fastapi import FastAPI, Request, APIRouter
from simulator.simulator import simulate_flood_dns
from simulator.job_generator import gen_ddp_pairs
from models.simulation import SimulationPayload, TemporyPayload
import os
import pandas as pd
import subprocess
from schemas.simulation import deleteSimulation, popSimulation, insertSimulation, update_simulation_db, popResults
from datetime import datetime
from bson.objectid import ObjectId

router = APIRouter()


@router.post("/simulate_flood_dns")
async def run_simulation(request: Request):
    payload = await request.json()
    payload_data = SimulationPayload(
        simulation_name=payload['params']['simulation_name'],
        num_jobs=payload['params']['num_jobs'],
        num_tors=payload['params']['num_tors'],
        num_cores=payload['params']['num_cores'],
        ring_size=payload['params']['ring_size'],
        routing=payload['params']['routing'],
        path=payload['params']['path']
    )
    simulation_data = TemporyPayload(
        simulation_name=payload['params']['simulation_name'],
        num_jobs=payload['params']['num_jobs'],
        num_tors=payload['params']['num_tors'],
        num_cores=payload['params']['num_cores'],
        ring_size=payload['params']['ring_size'],
        routing=payload['params']['routing'],
        path=payload['params']['path']
    )
    if payload_data.ring_size == 1:
        payload_data.ring_size = 2
    traffic = await gen_ddp_pairs(
        accelerator_name="AWS_TRAINIUM_V1",
        n_tors=payload_data.num_tors,
        num_concurrent_jobs=payload_data.num_jobs,
        data_parallelism_dim=payload_data.ring_size
    )
    result = await simulate_flood_dns(
        num_jobs=payload_data.num_jobs,
        num_tors=payload_data.num_tors,
        num_cores=payload_data.num_cores,
        ring_size=payload_data.ring_size,
        routing="ecmp"
    )

    job_info_path = os.path.join(".", "flooddns", "runs", f"concurrent_jobs_{payload_data.num_jobs}",
                                 f"{payload_data.num_cores}_core_failures", f"ring_size_{payload_data.ring_size}", "ecmp", "logs_floodns", "job_info.csv")
    job_path = os.path.join(".", "flooddns", "runs", f"concurrent_jobs_{payload_data.num_jobs}",
                            f"{payload_data.num_cores}_core_failures", f"ring_size_{payload_data.ring_size}", "ecmp")
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
    if not job_info.empty:
        datas = []
        for j in range(len(job_info)):
            data = {
                "job_id": int(job_info.iloc[j, 0]),
                "epoch": int(job_info.iloc[j, 1]),
                "stage": int(job_info.iloc[j, 2]),
                "start_time": int(job_info.iloc[j, 3]),
                "end_time": int(job_info.iloc[j, 4]),
                "duration": int(job_info.iloc[j, 5]),
                "finished": job_info.iloc[j, 6],
                "total_flows": int(job_info.iloc[j, 7]),
                "flow_size": int(job_info.iloc[j, 8]),
                "conn_ids": any(job_info.iloc[j, 9])
            }
            datas.append(data)

        current_date = datetime.today().strftime('%Y-%m-%d')

        simulation = {
            "simulation_name": str(simulation_data.simulation_name),
            # "datas":list(datas),
            "path": job_path,
            "date": current_date,
            "params": str(payload_data.num_jobs) + "," + str(payload_data.ring_size) + "," + str(payload_data.routing),
            "user_id": str(payload['user_id']),
            "result": result
        }
        await insertSimulation(simulation)
        simulations1 = await popSimulation(str(payload['user_id']))
        return {"data": simulations1, "progress": result}


@router.post("/get_simulate_flood_dns")
async def get_simulation(request: Request):
    user_id = await request.json()
    simulations1 = await popSimulation(user_id['state'])
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


@router.post("/delte_simulation")
async def delte_simulation(request: Request):
    params = await request.json()
    payload = params['data']
    await deleteSimulation({"_id": ObjectId(payload)})
    simulations1 = await popSimulation(str(params['user_id']))
    return simulations1


@router.post("/simulation_update")
async def update_simulation(request: Request):
    payload = await request.json()
    print(payload['simulation'][0]['simulation_id'])
    await update_simulation_db(payload['params'], payload['simulation'][0]['simulation_id'], payload["user_id"])
    simulations1 = await popSimulation(str(payload['user_id']))
    return simulations1


@router.post("/show_result")
async def show_results(request: Request):
    payload = await request.json()
    result = await popResults(str(payload["user_id"]), str(payload['data']))
    return result
