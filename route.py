from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
import tempfile
import os
from uuid import uuid4

from app import graph
from state import FactureProcessingState

router = APIRouter()

@router.post("/detecter_fraude/")
async def detecter_fraude(
    factures: List[UploadFile] = File(...),
    ordre_mission: List[UploadFile] = File(...)
):
    with tempfile.TemporaryDirectory() as factures_dir, tempfile.TemporaryDirectory() as ordres_dir:

        for facture in factures:
            extension = os.path.splitext(facture.filename)[-1]
            path = os.path.join(factures_dir, f"{uuid4()}{extension}")
            with open(path, "wb") as f:
                f.write(await facture.read())

        for ordre in ordre_mission:
            extension = os.path.splitext(ordre.filename)[-1]
            path = os.path.join(ordres_dir, f"{uuid4()}{extension}")
            with open(path, "wb") as f:
                f.write(await ordre.read())

        state_init = FactureProcessingState(
            dossier_factures=factures_dir,
            dossier_ordres=ordres_dir
        )
        result = graph.invoke(state_init)

    return JSONResponse(content={"résultats": result["resultats_fraude"]})

@router.get("/")
def home():
    return("Message: Bienvenue")