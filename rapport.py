import json
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.colors import red, green, black

def generer_rapport_pdf(resultat_json="validation_resultats.json", sortie_pdf="rapport_final.pdf"):
    try:
        with open(resultat_json, "r", encoding="utf-8") as f:
            factures = json.load(f)
        factures = [f for f in factures if isinstance(f, dict)]
    except Exception as e:
        print(f"Erreur de lecture JSON : {e}")
        return

    pdf = canvas.Canvas(sortie_pdf, pagesize=A4)
    width, height = A4
    y = height - 2 * cm

    # Titre
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(2 * cm, y, "Rapport de validation des factures")
    y -= 1.5 * cm

    # En-tête de tableau
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(2 * cm, y, "Facture")
    pdf.drawString(8 * cm, y, "Montant")
    pdf.drawString(11 * cm, y, "Statut")
    pdf.drawString(14 * cm, y, "Raison")
    y -= 0.3 * cm
    pdf.line(2 * cm, y, width - 2 * cm, y)
    y -= 0.7 * cm

    pdf.setFont("Helvetica", 10)
    montant_total = 0.0

    for f in factures:
        nom = f.get("nom_facture", "inconnu")
        montant = f.get("montant_total", "inconnu")
        statut = f.get("statut_validation", "inconnu")
        raison = f.get("raison_si_non_valide", "") or "RAS"

        # Traitement des types
        if not isinstance(raison, str):
            raison = str(raison)
        is_valide = statut == "Validé"

        # Couleurs
        color = green if is_valide else red
        pdf.setFillColor(color)

        # Montant
        montant_str = "inconnu"
        if isinstance(montant, (int, float)):
            montant_str = f"{montant:.2f} MAD"
            if is_valide:
                montant_total += montant

        # Vérification pagination
        if y < 3 * cm:
            pdf.showPage()
            y = height - 2 * cm

        # Impression des champs
        pdf.drawString(2 * cm, y, nom[:30])
        pdf.drawString(8 * cm, y, montant_str)
        pdf.drawString(11 * cm, y, statut)

        # Texte multiligne pour la raison
        text_obj = pdf.beginText()
        text_obj.setTextOrigin(14 * cm, y)
        text_obj.setFont("Helvetica", 10)

        mots = raison.split()
        ligne = ""
        max_width = 5 * cm
        nb_lignes = 0  # Compteur de lignes

        for mot in mots:
            test_ligne = f"{ligne} {mot}".strip()
            if stringWidth(test_ligne, "Helvetica", 10) <= max_width:
                ligne = test_ligne
            else:
                text_obj.textLine(ligne)
                nb_lignes += 1
                ligne = mot

        if ligne:
            text_obj.textLine(ligne)
            nb_lignes += 1

        pdf.drawText(text_obj)

        # Ajuster la hauteur utilisée
        y -= max(1.2 * cm, nb_lignes * 0.5 * cm)

        pdf.setFillColor(black)  # Reset couleur

    # Résumé total
    y -= 1 * cm
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(2 * cm, y, f"Montant total à verser à l’employé : {montant_total:.2f} MAD")

    pdf.save()
    print(f"Rapport PDF généré avec succès : {sortie_pdf}")
