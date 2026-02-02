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
# Diagramme de flux du projet

## 1️⃣ Architecture Frontend / Backend

```mermaid
graph LR
    A[React Frontend] <--> B[Spring Boot Backend]
    B <--> C[FastAPI + LangGraph]
    C <--> D[Gemini API]
    B --> E[(MongoDB)]
```markdown
## 2️⃣ Intelligence Artificielle & Workflow Agentique

```mermaid
graph TD
    Start((Début)) --> Input[Réception Image Facture + Ordre de Mission]
    Input --> Node1[Node: Extraction\nGemini 1.5 Flash]
    Node1 --> JSON{Format JSON Valide?}
    
    JSON -- Non --> Node1
    JSON -- Oui --> Node2[Node: Analyse de Conformité]
    
    Node2 --> Check1{📍 Ville autorisée?}
    Node2 --> Check2{📅 Dates valides?}
    Node2 --> Check3{💰 Budget respecté?}
    
    Check1 & Check2 & Check3 --> Result[Génération Rapport Final]
    Result --> End((Fin: Stockage MongoDB))
    
    style Node1 fill:#f9f,stroke:#333,stroke-width:2px
    style Node2 fill:#bbf,stroke:#333,stroke-width:2px
