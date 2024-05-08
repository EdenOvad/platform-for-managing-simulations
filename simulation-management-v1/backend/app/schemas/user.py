import motor.motor_asyncio
import bcrypt

client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
db = client.get_database("db_simulation")
users_collection = db.get_collection("users")


async def get_user(data: str):
    return await users_collection.find_one({"username": data})


async def save_user(data: object):
    if await users_collection.find_one({"username": data["username"]}):
        return "User is already registered!"
    else:
        hashpassword = bcrypt.hashpw(
            data["password"].encode("utf-8"), bcrypt.gensalt(10))
        data['password'] = hashpassword
        users_collection.insert_one(data)
        return "Register successed!"
