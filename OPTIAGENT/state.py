from langgraph.graph import StateGraph
from typing import List, Dict, Optional
from pydantic import BaseModel

class FactureProcessingState(BaseModel):
    dossier_factures: Optional[str] = None
    dossier_ordres: Optional[str] = None
    factures_extraites: List[Dict] = []
    ordres_extraits: List[Dict] = []
    resultats_fraude: List[Dict] = []
