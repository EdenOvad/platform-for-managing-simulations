from pydantic import BaseModel

# class main for username login and register


class User(BaseModel):
    username: str
    email: str
    hashed_password: str
