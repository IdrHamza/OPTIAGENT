from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
import tempfile
import os
import json
from datetime import datetime
from uuid import uuid4

from app import graph
from state import FactureProcessingState

# Import pour la base de données
import motor.motor_asyncio
from bson import ObjectId

# Configuration de la connexion MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.optiagent  # Utiliser la base de données existante 'optiagent'
executions_collection = db.executions

router = APIRouter()

@router.post("/detecter_fraude/")
async def detecter_fraude(
    factures: List[UploadFile] = File(...),
    ordre_mission: UploadFile = File(...),
    agent_id: Optional[str] = Form(None)  # Nouveau paramètre pour l'ID de l'agent
):
    # Générer un ID unique pour cette exécution
    execution_id = str(uuid4())
    
    # Enregistrer le début de l'exécution dans la base de données
    execution_record = {
        "_id": execution_id,
        "agent_id": agent_id,
        "status": "en_cours",
        "date_debut": datetime.now().isoformat(),
        "fichiers": {
            "nb_factures": len(factures),
            "ordre_mission": ordre_mission.filename
        },
        "resultats": None
    }
    
    await executions_collection.insert_one(execution_record)
    
    try:
        with tempfile.TemporaryDirectory() as factures_dir, tempfile.TemporaryDirectory() as ordres_dir:

            for facture in factures:
                extension = os.path.splitext(facture.filename)[-1]
                path = os.path.join(factures_dir, f"{uuid4()}{extension}")
                with open(path, "wb") as f:
                    f.write(await facture.read())

            # Traiter l'ordre de mission comme un seul fichier
            extension = os.path.splitext(ordre_mission.filename)[-1]
            path = os.path.join(ordres_dir, f"{uuid4()}{extension}")
            with open(path, "wb") as f:
                f.write(await ordre_mission.read())

            state_init = FactureProcessingState(
                dossier_factures=factures_dir,
                dossier_ordres=ordres_dir
            )
            result = graph.invoke(state_init)
            
            # Mettre à jour l'enregistrement dans la base de données avec les résultats
            await executions_collection.update_one(
                {"_id": execution_id},
                {"$set": {
                    "status": "termine",
                    "date_fin": datetime.now().isoformat(),
                    "resultats": result["resultats_fraude"]
                }}
            )
            
            # Récupérer l'enregistrement mis à jour pour le retourner
            updated_execution = await executions_collection.find_one({"_id": execution_id})
            
            return JSONResponse(content={
                "execution_id": execution_id,
                "agent_id": agent_id,
                "résultats": result["resultats_fraude"],
                "status": "termine"
            })
            
    except Exception as e:
        # En cas d'erreur, mettre à jour le statut dans la base de données
        await executions_collection.update_one(
            {"_id": execution_id},
            {"$set": {
                "status": "erreur",
                "date_fin": datetime.now().isoformat(),
                "erreur": str(e)
            }}
        )
        
        # Renvoyer une réponse d'erreur
        return JSONResponse(
            status_code=500,
            content={"message": f"Une erreur est survenue: {str(e)}", "execution_id": execution_id}
        )

@router.get("/")
def home():
    return("Message: Bienvenue")

@router.get("/executions/")
async def get_all_executions():
    """Récupérer toutes les exécutions depuis MongoDB"""
    try:
        # Récupérer toutes les exécutions et les convertir en liste
        executions = await executions_collection.find().to_list(length=100)
        
        # Convertir les ObjectId en chaînes pour la sérialisation JSON
        for execution in executions:
            execution["_id"] = str(execution["_id"])
        
        return executions
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Erreur lors de la récupération des exécutions: {str(e)}"}
        )

@router.get("/executions/agent/{agent_id}")
async def get_executions_by_agent_id(agent_id: str):
    """Récupérer les exécutions d'un agent spécifique"""
    try:
        # Récupérer les exécutions pour l'agent spécifié
        executions = await executions_collection.find({"agent_id": agent_id}).to_list(length=100)
        
        # Convertir les ObjectId en chaînes pour la sérialisation JSON
        for execution in executions:
            execution["_id"] = str(execution["_id"])
        
        return executions
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Erreur lors de la récupération des exécutions pour l'agent {agent_id}: {str(e)}"}
        )

@router.delete("/executions/agent/{agent_id}")
async def delete_executions_by_agent_id(agent_id: str):
    """Supprimer toutes les exécutions associées à un agent"""
    try:
        # Supprimer les exécutions pour l'agent spécifié
        result = await executions_collection.delete_many({"agent_id": agent_id})
        
        return JSONResponse(
            content={
                "message": f"Exécutions supprimées pour l'agent {agent_id}",
                "count": result.deleted_count
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Erreur lors de la suppression des exécutions pour l'agent {agent_id}: {str(e)}"}
        )

@router.get("/executions/{execution_id}")
async def get_execution_by_id(execution_id: str):
    """Récupérer une exécution spécifique par son ID"""
    try:
        # Récupérer l'exécution spécifiée
        execution = await executions_collection.find_one({"_id": execution_id})
        
        if not execution:
            return JSONResponse(
                status_code=404,
                content={"message": f"Exécution {execution_id} non trouvée"}
            )
        
        # Convertir l'ObjectId en chaîne pour la sérialisation JSON
        execution["_id"] = str(execution["_id"])
        
        return execution
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Erreur lors de la récupération de l'exécution {execution_id}: {str(e)}"}
        )