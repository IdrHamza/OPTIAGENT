import google.generativeai as genai
from PIL import Image

import os
import json
import re
from datetime import datetime

from dotenv import load_dotenv
from pdf2image import convert_from_path
from state import FactureProcessingState

import pandas as pd

from langgraph.graph import StateGraph, START, END
from state import FactureProcessingState
import import_ipynb

# Charger les variables d'environnement
load_dotenv()

# Récupérer la clé API 
API_KEY = os.getenv("GEMINI_API_KEY")

# Vérifier si la clé API est présente
if not API_KEY:
    raise ValueError("Clé API Gemini non définie dans les variables d'environnement.")

# Configurer l'API Gemini
genai.configure(api_key=API_KEY)

# Initialiser le modèle
model = genai.GenerativeModel('gemini-1.5-flash')

def extraire_json(reponse_brute):
    match = re.search(r"```json\s*({.*?})\s*```", reponse_brute, re.DOTALL)
    return match.group(1) if match else None

def extraire_donnees_facture(image):
    
    try:
        prompt = """
        À partir de l'image de la facture fournie, extrais les informations suivantes sous forme JSON :
        - Nom du commerce (restaurant, hôtel, magasin, etc.)
        - Date de la facture (format YYYY-MM-DD)
        - Montant total (convertire l'unite en dirham marocain)
        - Adresse complète
        - Ville

        Retourne uniquement un JSON valide sans texte supplémentaire.
        """

        # L'extraction des factures
        response = model.generate_content([prompt, image])

        json_str = extraire_json(response.text)

        return json.loads(json_str) if json_str else None

    except Exception as e:
        print(f" Erreur lors de l'extraction : {e}")
        return None

def convertir_pdf_en_images(pdf_path):
    return convert_from_path(pdf_path, poppler_path="C:\\Program Files\\poppler-24.08.0\\Library\\bin")

def traiter_dossier_factures(state: FactureProcessingState) -> FactureProcessingState:
   
    dossier_factures = state.dossier_factures
    resultats = []
    
    for fichier in os.listdir(dossier_factures):
        chemin_fichier = os.path.join(dossier_factures, fichier)

        if fichier.lower().endswith((".jpg", ".jpeg", ".png")):
            image = Image.open(chemin_fichier)
            donnees_facture = extraire_donnees_facture(image)
            if donnees_facture:
                resultats.append({"nom_fichier": fichier, **donnees_facture})

        elif fichier.lower().endswith(".pdf"):
            images = convertir_pdf_en_images(chemin_fichier)
            for i, image in enumerate(images):  # Traiter chaque page du PDF
                donnees_facture = extraire_donnees_facture(image)
                if donnees_facture:
                    resultats.append({"nom_fichier": f"{fichier} (page {i+1})", **donnees_facture})

    state.factures_extraites = resultats
    return state

def extraire_donnees_ordre_mission(image):

    try:
        # Prompt pour les ordres de mission
        prompt = """
        À partir de l'image de l'ordre de mission fournie, extrais les informations suivantes sous forme JSON :
        - Nom de l'employé
        - Date de début (format YYYY-MM-DD)
        - Date de fin (format YYYY-MM-DD)
        - Destination (ville)
        - Objet de la mission

        Retourne uniquement un JSON valide sans texte supplémentaire.
        """

        # L'extraction des ordres de mission
        response = model.generate_content([prompt, image])

        json_str = extraire_json(response.text)

        return json.loads(json_str) if json_str else None

    except Exception as e:
        print(f"❌ Erreur lors de l'extraction : {e}")
        return None

def traiter_dossier_ordres(state:FactureProcessingState) -> FactureProcessingState:
    
    dossier_ordres = state.dossier_ordres
    resultats = []
    
    for fichier in os.listdir(dossier_ordres):
        chemin_fichier = os.path.join(dossier_ordres, fichier)

        if fichier.lower().endswith((".jpg", ".jpeg", ".png")):
            image = Image.open(chemin_fichier)
            donnees_ordre = extraire_donnees_ordre_mission(image)
            if donnees_ordre:
                resultats.append({"nom_fichier": fichier, **donnees_ordre})

        elif fichier.lower().endswith(".pdf"):
            images = convertir_pdf_en_images(chemin_fichier)
            for i, image in enumerate(images):  # Traiter chaque page du PDF
                donnees_ordre = extraire_donnees_ordre_mission(image)
                if donnees_ordre:
                    resultats.append({"nom_fichier": f"{fichier} (page {i+1})", **donnees_ordre})

    state.ordres_extraits = resultats
    return state

def nettoyer_montant(montant):
    if isinstance(montant, str):  
        montant = montant.replace("$", "").replace(",", ".").strip()  
        try:
            return float(montant)  
        except ValueError:
            return 0.0  
    return montant if isinstance(montant, (int, float)) else 0.0  

def verifier_fraude_factures(state:FactureProcessingState, seuil_montant=1000) -> FactureProcessingState:
    
    factures_data = state.factures_extraites
    mission_data = state.ordres_extraits

    # Convert to DataFrames directly
    df_factures = pd.DataFrame(factures_data)
    df_mission = pd.DataFrame(mission_data)

    # Vérifier si le fichier des ordres de mission contient des données
    if df_mission.empty:
        raise ValueError("Le fichier JSON des ordres de mission est vide.")

    # Extraire la première ligne du JSON des missions
    ordre_mission = df_mission.iloc[0]

    ville_mission = ordre_mission.get("Destination", "").lower()
    date_depart = datetime.strptime(ordre_mission["Date de début"], "%Y-%m-%d")
    date_retour = datetime.strptime(ordre_mission["Date de fin"], "%Y-%m-%d")

    # Vérifier l'existence des colonnes dans df_factures
    df_factures["Ville"] = df_factures.get("Ville", df_factures.get("city", None)).str.lower()
    df_factures["adresse"] = df_factures.get("Adresse complète", df_factures.get("address", None))

    # Convertir les dates (et gérer les erreurs)
    df_factures["date"] = pd.to_datetime(df_factures.get("Date de la facture", None), errors="coerce")

    # Nettoyer et convertir le montant
    df_factures["montant_total"] = df_factures.get("Montant total", df_factures.get("total", None)).apply(nettoyer_montant)

    # Vérification ligne par ligne
    def verifier_facture(row):
        raisons = []
        if row["Ville"] != ville_mission:
            raisons.append("Ville non correspondante")

        # Vérifier la date de la facture
        facture_date = pd.to_datetime(row["Date de la facture"], errors="coerce")  # Convertir ici
        if pd.isnull(facture_date):
            raisons.append("Date manquante")
        elif not (date_depart <= facture_date <= date_retour):
            raisons.append("Date hors période de mission")

        if float(row["Montant total"]) is None:
            raisons.append("Montant invalide")
        elif float(row["Montant total"]) > seuil_montant:
            raisons.append(f"Montant suspect (>{seuil_montant})")

        fraude = "Oui" if raisons else "Non"
        return pd.Series([fraude, ", ".join(raisons) if raisons else "Facture valide"])

    # Appliquer la vérification sur chaque facture
    df_factures[["fraude", "raison"]] = df_factures.apply(verifier_facture, axis=1)

    # Sélectionner uniquement les colonnes importantes
    df_factures = df_factures[["nom_fichier","Nom du commerce" ,"Date de la facture", "Montant total", "Ville", "Adresse complète", "fraude", "raison"]]

     # Déterminer le chemin de sortie du fichier JSON
    output_path = os.path.join(os.getcwd(), "factures_fraudees.json")

    # Enregistrer automatiquement les résultats dans un fichier JSON
    df_factures.to_json(output_path, orient="records", indent=4, force_ascii=False)

    print(f"✅ Résultats enregistrés automatiquement dans {output_path}")
    state.resultats_fraude = df_factures
    return state

# Initialiser le graphe
workflow = StateGraph(FactureProcessingState)

# Ajouter les nœuds
workflow.add_node("Extraction Factures", traiter_dossier_factures)
workflow.add_node("Extraction Ordre", traiter_dossier_ordres)
workflow.add_node("Vérification Fraude", verifier_fraude_factures)

# Connecter les étapes
workflow.add_edge(START, "Extraction Factures")
workflow.add_edge("Extraction Factures", "Extraction Ordre")
workflow.add_edge("Extraction Ordre", "Vérification Fraude")
workflow.add_edge("Vérification Fraude", END)

# Compiler le graphe
graph = workflow.compile()
