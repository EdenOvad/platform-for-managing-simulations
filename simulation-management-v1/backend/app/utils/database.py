from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")


def get_mongo_client():
    client = MongoClient(MONGO_URI)
    return client


if MONGO_URI:
    print("MONGODB_URI loaded successfully:", MONGO_URI)
else:
    print("MONGODB_URI not found in .env file or not loaded")
