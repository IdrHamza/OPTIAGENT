# 🛡️ AI-Powered Invoice Fraud Detector

**Système intelligent de détection de fraude aux factures basé sur des workflows agentiques.**

Ce projet automatise la vérification de la conformité des factures par rapport aux ordres de mission. Il utilise un agent IA pour extraire les données, vérifier les conditions géographiques (villes) et temporelles (périodes), et signaler toute anomalie ou tentative de fraude.

---

## 🏗️ Architecture du Système

L'application repose sur une architecture multi-services pour séparer la logique métier de l'intelligence artificielle :

* **Frontend** : Interface utilisateur réactive avec **React.js**.
* **Backend Orchestrateur** : Développé en **Java (Spring Boot)**, il gère la logique métier, les utilisateurs et la persistance des données.
* **AI Engine (Microservice)** : Développé en **Python (FastAPI)**, il utilise **LangGraph** et **Google Gemini API** pour l'analyse documentaire intelligente.
* **Base de données** : **MongoDB** pour la flexibilité du stockage des documents (NoSQL).

### Diagramme de flux
```mermaid
graph LR
    A[React Frontend] <--> B[Spring Boot Backend]
    B <--> C[FastAPI + LangGraph]
    C <--> D[Gemini API]
    B --> E[(MongoDB)]


    ## 🧠 Intelligence Artificielle & Workflow Agentique

Contrairement à un simple script OCR, ce projet utilise un **Agent intelligent** orchestré par **LangGraph**. Ce workflow permet de passer d'une simple lecture de texte à une véritable prise de décision logique.

### Processus de décision


* **Extraction Multimodale** : Utilisation de **Gemini 1.5 Flash** pour transformer les images de factures en données structurées (JSON).
* **Prompt Engineering** : Un prompt rigoureux garantit l'extraction du nom du commerce, de la date, du montant (converti en MAD) et de la ville.
* **Analyse de Conformité** : L'agent compare dynamiquement les données extraites avec les contraintes de l'ordre de mission :
    * 📍 **Géographie** : La ville de la dépense est-elle autorisée ?
    * 📅 **Temporalité** : La date de la facture correspond-elle à la période de mission ?
    * 💰 **Finances** : Le montant respecte-t-il les plafonds autorisés ?

---

## 🛠️ Stack Technique

| Technologie | Utilisation |
| :--- | :--- |
| **Java / Spring Boot** | API REST & Orchestration métier |
| **FastAPI (Python)** | Microservice IA & Workflow Agentique |
| **LangGraph / LangChain** | Gestion des cycles de l'agent et de l'état |
| **Google Gemini API** | Modèle de vision et extraction LLM |
| **React.js** | Interface utilisateur (Dashboard) |
| **MongoDB** | Stockage flexible des documents et rapports |
| **Maven** | Gestionnaire de dépendances Java |
