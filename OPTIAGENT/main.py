from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from route import router

app = FastAPI()

# Configuration CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, remplacez par ["http://localhost:3000"] ou votre domaine
    allow_credentials=True,
    allow_methods=["*"],  # Vous pouvez restreindre à ["GET", "POST"] si nécessaire
    allow_headers=["*"],
)

app.include_router(router)
