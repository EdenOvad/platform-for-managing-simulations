import motor.motor_asyncio
import bson
from bson import ObjectId

client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
db = client.get_database("db_simulation")
simulations_collection = db.get_collection("simulations")
users_collection = db.get_collection("users")


async def insertSimulation(data: object):
    await simulations_collection.insert_one(data)


async def deleteSimulation(data: object):
    await simulations_collection.delete_one(data)


async def popSimulation(data: str):
    simulations = []
    async with simulations_collection.find({"user_id": data}, {"simulation_name": 1, "date": 1, "params": 1, "path": 1, "_id": 1}) as cursor:
        async for document in cursor:
            if document["simulation_name"]:
                simulations.append({"simulation_name": document["simulation_name"], "date": document["date"], "parameters": document[
                                   "params"], "isRunning": "true", "path": document["path"], "simulation_id": str(document['_id'])})
            else:
                continue
    return simulations


async def update_simulation_db(data: object, simulation_id: str, user_id: str):
    result = await simulations_collection.find_one_and_update({"user_id": user_id, "_id": ObjectId(simulation_id)}, {"$set": {"params": str(data['params']), "result": str(data['result']), "simulation_name": data['simulation_name']}})
    return result


async def popResults(user_id: str, data: str):
    async with simulations_collection.find({"user_id": user_id, "_id": ObjectId(data)}, {"result": 1}) as cursor:
        async for document in cursor:
            if document["result"]:
                return document["result"]
