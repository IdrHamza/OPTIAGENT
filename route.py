from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import os
import shutil
from uuid import uuid4
from typing import List
from app_1 import graph  
from state import FactureProcessingState

router = APIRouter()

# Définir les dossiers
FACTURES_DIR = "factures"
ORDRES_DIR = "ordre_mission"

# Créer les dossiers s'ils n'existent pas
os.makedirs(FACTURES_DIR, exist_ok=True)
os.makedirs(ORDRES_DIR, exist_ok=True)

def clean_directory(path):
    for f in os.listdir(path):
        os.remove(os.path.join(path, f))

@router.post("/detecter_fraude/")
async def detecter_fraude(
    factures: List[UploadFile] = File(...),
    ordre_mission: List[UploadFile] = File(...)
):
    # Nettoyer les anciens fichiers
    clean_directory(FACTURES_DIR)
    clean_directory(ORDRES_DIR)

    # Sauvegarder les nouvelles factures
    for facture in factures:
        extension = os.path.splitext(facture.filename)[-1]
        dest = os.path.join(FACTURES_DIR, f"{uuid4()}{extension}")
        with open(dest, "wb") as f:
            f.write(await facture.read())

    # Sauvegarder le ou les ordres de mission
    for ordre in ordre_mission:
        extension = os.path.splitext(ordre.filename)[-1]
        dest = os.path.join(ORDRES_DIR, f"{uuid4()}{extension}")
        with open(dest, "wb") as f:
            f.write(await ordre.read())

    # Lancer l'agent avec les bons chemins
    state_init = FactureProcessingState(
        dossier_factures=FACTURES_DIR,
        dossier_ordres=ORDRES_DIR
    )
    
    result = graph.invoke(state_init)

    return JSONResponse(content={"résultats": result.resultats_fraude})

@router.get("/")
def home():
    return {"message": "Bienvenue dans l'API de détection de fraude RPA !"}
