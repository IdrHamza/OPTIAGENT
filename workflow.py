from langgraph.graph import StateGraph, START, END
import os

# Import des fonctions personnalisées
from facture_extraction import extraire_factures
from ordre_extraction import extraire_ordre_mission
from verification import comparer_factures_et_ordres
from rapport import generer_rapport_pdf

# Étape 1 : Extraction des factures
def step_factures(state: dict):
    print("Étape 1 : Extraction des factures")
    extraire_factures(dossier_factures=state["factures_dir"], sortie=os.path.join(state["session_path"], "resultats_factures.json"))
    return state

# Étape 2 : Extraction des ordres de mission
def step_ordre(state: dict):
    print("Étape 2 : Extraction des ordres de mission")
    extraire_ordre_mission(dossier_ordres=state["ordres_dir"], sortie=os.path.join(state["session_path"], "ordre.json"))
    return state

# Étape 3 : Comparaison
def step_validation(state: dict):
    print("Étape 3 : Validation des factures")
    comparer_factures_et_ordres(
        factures_path=os.path.join(state["session_path"], "resultats_factures.json"),
        ordre_path=os.path.join(state["session_path"], "ordre.json"),
        sortie_path=os.path.join(state["session_path"], "validation_resultats.json")
    )
    return state

# Étape 4 : Génération du rapport PDF
def step_generer_rapport(state: dict):
    print("Étape 4 : Génération du rapport PDF")
    generer_rapport_pdf(
        resultat_json=os.path.join(state["session_path"], "validation_resultats.json"),
        sortie_pdf=os.path.join(state["session_path"], "rapport_final.pdf")
    )
    return state

# Création du graphe LangGraph
workflow = StateGraph(dict)

workflow.add_node("Extraction Factures", step_factures)
workflow.add_node("Extraction Ordre", step_ordre)
workflow.add_node("Validation", step_validation)
workflow.add_node("Générer Rapport", step_generer_rapport)

workflow.add_edge(START, "Extraction Factures")
workflow.add_edge("Extraction Factures", "Extraction Ordre")
workflow.add_edge("Extraction Ordre", "Validation")
workflow.add_edge("Validation", "Générer Rapport")
workflow.add_edge("Générer Rapport", END)

graph = workflow.compile()