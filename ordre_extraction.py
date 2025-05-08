import os
import re
import json
from pdf2image import convert_from_path
from PIL import Image
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def extraire_json(reponse_brute):
    match = re.search(r"{.*}", reponse_brute, re.DOTALL)
    return match.group(0) if match else None

def extraire_donnees_image(image: Image.Image):
    prompt = """
Tu es un assistant intelligent. Extrait depuis l'image :
- nom_employe
- ville_deplacement
- date_depart (YYYY-MM-DD)
- date_retour (YYYY-MM-DD)
Retourne un JSON sans texte autour.
"""
    try:
        response = model.generate_content([prompt, image])
        json_str = extraire_json(response.text)
        if json_str:
            return json.loads(json_str)
    except:
        return {}
    return {
        "nom_employe": "Non disponible",
        "ville_deplacement": "Non disponible",
        "date_depart": "Non disponible",
        "date_retour": "Non disponible"
    }

def extraire_ordre_mission(dossier_ordres="ordres_mission", sortie="ordre.json"):
    resultats = []

    for fichier in os.listdir(dossier_ordres):
        if fichier.lower().endswith(".pdf"):
            chemin_pdf = os.path.join(dossier_ordres, fichier)
            images = convert_from_path(chemin_pdf, dpi=200)
            for i, image in enumerate(images):
                donnees = extraire_donnees_image(image)
                resultats.append({
                    "nom_fichier": f"{fichier} (page {i+1})",
                    **donnees
                })

    with open(sortie, "w", encoding="utf-8") as f:
        json.dump(resultats, f, indent=4, ensure_ascii=False)

    print(f"Ordres extraits dans '{sortie}'")
