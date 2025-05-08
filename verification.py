import os
import re
import json
from dotenv import load_dotenv
import google.generativeai as genai

# 🔐 Charger la clé API
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

# 🔎 Extraire un JSON valide depuis la réponse texte
def extraire_json(reponse_brute):
    match = re.search(r"\[\s*{.*}\s*]", reponse_brute, re.DOTALL)
    return match.group(0) if match else None

# 🔁 Fonction principale appelée par workflow/API
def comparer_factures_et_ordres(
    factures_path="resultats_factures.json",
    ordre_path="ordre.json",
    sortie_path="validation_resultats.json"
):
    # 📥 Charger les factures
    with open(factures_path, "r", encoding="utf-8") as f:
        factures = json.load(f)

    # 📥 Charger les ordres
    with open(ordre_path, "r", encoding="utf-8") as f:
        ordres = json.load(f)

    if not isinstance(ordres, list):
        ordres = [ordres]

    # 🧠 Prompt
    prompt_template = """
Tu es un assistant RH chargé de valider des factures selon des ordres de mission.

Voici les factures à analyser :
FACTURES_JSON

Voici la liste des ordres de mission disponibles :
ORDRES_JSON

📌 Pour chaque facture, valide si :
- la **ville** de la facture correspond à la ville_deplacement d’au moins un ordre,
- la **date** est comprise entre date_depart et date_retour (inclus),
- ignore la casse (ex. rabat = Rabat).

💡 Une seule correspondance suffit à valider une facture.

💬 Format de réponse JSON :
[
  {
    "nom_facture": "...",
    "montant_total": 123.45,
    "statut_validation": "Validé" ou "Non Validé",
    "raison_si_non_valide": "..." ou vide si validé
  }
]
Réponds uniquement avec ce JSON (sans explication ni texte autour).
"""

    # 💬 Générer le prompt complet
    prompt = prompt_template.replace("FACTURES_JSON", json.dumps(factures, indent=2, ensure_ascii=False))
    prompt = prompt.replace("ORDRES_JSON", json.dumps(ordres, indent=2, ensure_ascii=False))

    # 🤖 Appel à Gemini
    response = model.generate_content(prompt)
    json_str = extraire_json(response.text)

    try:
        resultats = json.loads(json_str) if json_str else []
    except json.JSONDecodeError:
        resultats = []

    # 💾 Sauvegarde
    with open(sortie_path, "w", encoding="utf-8") as f:
        json.dump(resultats, f, indent=4, ensure_ascii=False)

    print(f"✅ Validation terminée. Résultats enregistrés dans '{sortie_path}'.")
