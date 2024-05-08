from pydantic import BaseModel

# class main for username


class User(BaseModel):
    username: str
    email: str
    hashed_password: str
