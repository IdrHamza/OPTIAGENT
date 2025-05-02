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
        Tu es un assistant intelligent chargé d'extraire automatiquement des informations à partir d'images de factures.

        À partir de l'image fournie, extrais uniquement les informations suivantes et retourne-les sous forme d'un JSON structuré :

        - "Nom du commerce" : nom de l’établissement (restaurant, hôtel, magasin, etc.)
        - "Date de la facture" : format YYYY-MM-DD
        - "Montant total" : valeur numérique uniquement, convertie en Dirham marocain (MAD) si ce n’est pas déjà le cas
        - "Adresse complète" : adresse entière telle qu'affichée
        - "Ville" : ville dans laquelle la dépense a été faite

        ❗ Consignes importantes :
        - Retourne uniquement un objet JSON valide, sans texte explicatif autour
        - N’inclus aucun préfixe comme "Voici le JSON" ou "```json"
        - Si une information n’est pas visible ou lisible, mets `"inconnu"`

        Exemple attendu :
        {
        "Nom du commerce": "Hotel Atlas",
        "Date de la facture": "2025-04-14",
        "Montant total": 720.50,
        "Adresse complète": "Av. Hassan II, Marrakech",
        "Ville": "Marrakech"
        }

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
            for i, image in enumerate(images):
                donnees_facture = extraire_donnees_facture(image)
                if donnees_facture:
                    resultats.append({"nom_fichier": f"{fichier} (page {i+1})", **donnees_facture})

    state.factures_extraites = resultats
    return state

def extraire_donnees_ordre_mission(image):

    try:
        # Prompt pour les ordres de mission
        prompt = """
        Tu es un assistant intelligent chargé d'extraire des informations structurées à partir d'une image d'ordre de mission.

        À partir de l’image fournie, identifie et retourne uniquement les données suivantes sous forme de JSON :

        - "Nom de l'employé" : nom complet de la personne en mission
        - "Date de début" : date de début de la mission, au format YYYY-MM-DD
        - "Date de fin" : date de fin de la mission, au format YYYY-MM-DD
        - "Destination" : ville de destination de la mission
        - "Objet de la mission" : raison ou description de la mission

        ❗ Consignes importantes :
        - Retourne **uniquement** un objet JSON **valide**
        - Ne retourne aucun texte, commentaire, ni balise `json`, seulement du JSON brut
        - Si une information n’est pas clairement lisible, utilise la valeur `"inconnu"`

        Exemple attendu :
        {
        "Nom de l'employé": "Said El Khatib",
        "Date de début": "2025-04-12",
        "Date de fin": "2025-04-14",
        "Destination": "Rabat",
        "Objet de la mission": "Participation à une conférence sectorielle"
        }

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

def verifier_fraude_factures(state:FactureProcessingState, seuil_montant=1000) -> FactureProcessingState:
    
    factures_data = state.factures_extraites
    mission_data = state.ordres_extraits

    if not factures_data or not mission_data:
        raise ValueError("❌ Données de facture ou d'ordre manquantes.")

    # Infos ordre de mission
    ordre = mission_data[0]
    ville_mission = ordre.get("Destination", "").lower()
    date_depart = ordre.get("Date de début")
    date_retour = ordre.get("Date de fin")

    resultats = []

    for facture in factures_data:

        prompt = f"""
        Tu es un expert en audit comptable. Voici une facture à analyser, ainsi qu’un ordre de mission de référence.

         Facture :
        - Ville : {facture.get('Ville', facture.get('city'))}
        - Date : {facture.get('Date de la facture')}
        - Montant : {facture.get('Montant total')}
        - Nom du commerce : {facture.get('Nom du commerce')}
        - Adresse : {facture.get('Adresse complète')}

         Ordre de mission :
        - Destination : {ville_mission}
        - Date de début : {date_depart}
        - Date de fin : {date_retour}

        Analyse les éléments suivants :
        1. Si une information est manquante (date, ville, montant, nom du commerce) → facture frauduleuse
        2. La date est-elle dans l'intervalle de la mission (avec une tolérance d'un jour avant/après) ?
        3. La ville est-elle cohérente avec la destination (ou une ville proche) ?
        4. Le montant est-il raisonnable pour le type de commerce ?
        5. Le type de commerce est-il cohérent avec un déplacement professionnel ?
        6. Est-ce que cette facture pourrait être considérée comme une dépense personnelle ?
        
        Ta tâche est de répondre uniquement avec un JSON contenant :
        {{
            "fraude": "Oui" ou "Non",
            "raison": "explication claire"(maitre les raisons dans une Json array),
            "confiance": 0.0 à 1.0
        }}

        """

        try:
            response = model.generate_content(prompt)
            json_str = extraire_json(response.text)  
            verdict = json.loads(json_str)
        except Exception as e:
            verdict = {"fraude": "Inconnu", "raison": f"Erreur LLM : {e}"}

        resultats.append({
            "nom_fichier": facture.get("nom_fichier"),
            "Nom du commerce": facture.get("Nom du commerce"),
            "Date de la facture": facture.get("Date de la facture"),
            "Montant total": facture.get("Montant total"),
            "Ville": facture.get("Ville", facture.get("city")),
            "Adresse complète": facture.get("Adresse complète"),
            "fraude": verdict.get("fraude"),
            "raison": verdict.get("raison"),
        })

    # Exporter en JSON
    output_path = os.path.join(os.getcwd(), "factures_fraudees.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(resultats, f, indent=4, ensure_ascii=False)

    print(f"✅ Résultats générés par LLM sauvegardés dans {output_path}")
    state.resultats_fraude = resultats
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

