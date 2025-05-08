from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from route import router  # Make sure 'route' is the correct path to your route module

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://127.0.0.1:8081", "http://localhost:3000"], # Ajout de l'origine de React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router for handling routes
app.include_router(router)

# No need to use uvicorn.run() in the file, Uvicorn will handle that
