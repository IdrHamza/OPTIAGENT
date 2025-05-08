import os
import re
import json
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def extraire_json(reponse_brute):
    match = re.search(r"{.*}", reponse_brute, re.DOTALL)
    return match.group(0) if match else None

def traiter_image(chemin_image):
    try:
        image = Image.open(chemin_image)
        prompt = """
Tu es un assistant intelligent chargé d'extraire des informations à partir d'images de factures.
À partir de l'image fournie, retourne un JSON avec :
- Nom du commerce
- Date de la facture (format YYYY-MM-DD)
- Montant total (en MAD)
- Adresse complète
- Ville
Si une info est manquante, écris "inconnu".
"""
        response = model.generate_content([prompt, image])
        json_str = extraire_json(response.text)
        if json_str:
            return json.loads(json_str)
    except Exception as e:
        print(f"Erreur pour {chemin_image}: {e}")
    return {
        "Nom du commerce": "inconnu",
        "Date de la facture": "inconnu",
        "Montant total": "inconnu",
        "Adresse complète": "inconnu",
        "Ville": "inconnu"
    }

def extraire_factures(dossier_factures="factures", sortie="resultats_factures.json"):
    resultats = []

    for fichier in os.listdir(dossier_factures):
        if fichier.lower().endswith((".jpg", ".jpeg", ".png")):
            chemin = os.path.join(dossier_factures, fichier)
            donnees = traiter_image(chemin)
            resultats.append({"nom_facture": fichier, **donnees})

    with open(sortie, "w", encoding="utf-8") as f:
        json.dump(resultats, f, indent=4, ensure_ascii=False)

    print(f"Factures extraites dans '{sortie}'")