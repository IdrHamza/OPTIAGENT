from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import shutil
import os
import json
import uuid
from datetime import datetime

# Importer ton graphe LangGraph
from workflow import graph

app = FastAPI()

# Autoriser le frontend à communiquer (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/traiter")
async def traiter_documents(
    factures: List[UploadFile] = File(...),
    ordres: List[UploadFile] = File(...)
):
    # Créer un ID de session unique
    session_id = f"{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}_{uuid.uuid4().hex[:6]}"
    session_path = os.path.join("sessions", session_id)
    factures_dir = os.path.join(session_path, "factures")
    ordres_dir = os.path.join(session_path, "ordres")

    os.makedirs(factures_dir, exist_ok=True)
    os.makedirs(ordres_dir, exist_ok=True)

    # Enregistrer les factures
    for file in factures:
        path = os.path.join(factures_dir, file.filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Enregistrer les ordres
    for file in ordres:
        path = os.path.join(ordres_dir, file.filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Lancer le workflow avec chemins dynamiques
    graph.invoke({
        "factures_dir": factures_dir,
        "ordres_dir": ordres_dir,
        "session_path": session_path
    })

    # Charger les résultats (pour les renvoyer au front)
    try:
        with open(os.path.join(session_path, "validation_resultats.json"), "r", encoding="utf-8") as f:
            validations = json.load(f)
    except:
        validations = []

    return JSONResponse(content={
        "message": "Analyse terminée avec succès.",
        "session_id": session_id,
        "rapport_url": f"/rapport/{session_id}",
        "validations": validations
    })

@app.get("/rapport/{session_id}")
def telecharger_rapport(session_id: str):
    path = os.path.join("sessions", session_id, "rapport_final.pdf")
    return FileResponse(path, media_type="application/pdf", filename="rapport_final.pdf")