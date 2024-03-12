from fastapi import FastAPI
from models.user import User
from fastapi import HTTPException
from utils.database import get_mongo_client
from main import users_collection

app = FastAPI()

@app.post("/register")
def register_user(user: User):
    try:
        # Check if the user already exists
        existing_user = users_collection.find_one({"username": user.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")

        # Insert the new user into the database
        result = users_collection.insert_one(user.dict())
        inserted_id = result.inserted_id

        return {"message": "User registered successfully", "user_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/login")
def login_user(username: str, password: str):
    try:
        # Find the user with the provided username and password
        user = users_collection.find_one({"username": username, "password": password})
        if user:
            return {"message": "Login successful"}
        else:
            raise HTTPException(status_code=401, detail="Invalid username or password")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
