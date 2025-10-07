from fastapi import FastAPI, Request, HTTPException, Depends
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()
origins = [
    "http://localhost:5173",   # React (Vite)
    "http://127.0.0.1:5173",   # kadang React pakai ini juga
    "http://localhost:3000",   # React (Create React App)
    "http://127.0.0.1:3000",   # kadang React pakai ini juga
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # frontend dev server
    allow_credentials=True,
    allow_methods=["*"],   # allow POST, GET, OPTIONS, etc.
    allow_headers=["*"],   # allow all headers
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

from app.core import events
from app.models import *

from app.api.imports.routes import excel_import_router

# from routers import import_routers
from routers import dashboard_routers

app.include_router(excel_import_router)
app.include_router(dashboard_routers.router)
