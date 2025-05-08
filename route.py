from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
import tempfile
import os
from uuid import uuid4

from app import graph
from state import FactureProcessingState
import logging
import sys

# Créer un logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Créer un handler pour la console
ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.DEBUG)

# Créer un formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Ajouter le formatter au handler
ch.setFormatter(formatter)

# Ajouter le handler au logger
logger.addHandler(ch)

router = APIRouter()

@router.post("/detecter_fraude/")
async def detecter_fraude(
    factures: List[UploadFile] = File(...),
    ordre_mission: List[UploadFile] = File(...)
):
    logger.debug("Début de detecter_fraude")  # Utiliser logger.debug

    print("Début de detecter_fraude")
    print(f"Nombre de factures reçues: {len(factures)}")
    print(f"Nombre d'ordres de mission reçus: {len(ordre_mission)}")
    try:

        with tempfile.TemporaryDirectory() as factures_dir, tempfile.TemporaryDirectory() as ordres_dir:
            print("Répertoires temporaires créés")

            for facture in factures:
                print(f"Traitement de la facture: {facture.filename}")
                extension = os.path.splitext(facture.filename)[-1]
                path = os.path.join(factures_dir, f"{uuid4()}{extension}")
                with open(path, "wb") as f:
                    f.write(await facture.read())
                print(f"Facture sauvegardée dans: {path}")

            for ordre in ordre_mission:
                print(f"Traitement de l'ordre de mission: {ordre.filename}")
                extension = os.path.splitext(ordre.filename)[-1]
                path = os.path.join(ordres_dir, f"{uuid4()}{extension}")
                with open(path, "wb") as f:
                    f.write(await ordre.read())
                print(f"Ordre de mission sauvegardé dans: {path}")

            state_init = FactureProcessingState(
                dossier_factures=factures_dir,
                dossier_ordres=ordres_dir
            )
            print("État initial créé")
            result = graph.invoke(state_init)
            print("Graph invoqué")
            logger.info("Graph invoqué avec succès")

        return JSONResponse(content={"résultats": result["resultats_fraude"]})
    except Exception as e:
        logger.error(f"Erreur dans detecter_fraude: {e}", exc_info=True)


        print(f"Erreur dans detecter_fraude: {e}")
        return JSONResponse(content={"detail": "Internal Server Error"}, status_code=500)

@router.get("/")
def home():
    return("Message: Bienvenue")