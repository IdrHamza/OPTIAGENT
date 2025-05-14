// Service pour la gestion des exécutions

// Importer le service d'agent pour récupérer les informations de l'agent
import { agentService } from './agent-service';
// Importer le service localStorage
import localStorageService from './local-storage-service';

const API_URL = 'http://localhost:8081/api';
const USE_LOCAL_STORAGE = true; // Mettre à true pour utiliser le localStorage au lieu de l'API

// Fonction utilitaire pour obtenir les en-têtes d'authentification
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Fonction utilitaire pour obtenir l'ID de l'utilisateur actuel
const getCurrentUserId = () => {
  try {
    const userStr = localStorage.getItem('opti_agent_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
  }
  return null;
};

// Fonction utilitaire pour mapper les statuts MongoDB aux statuts du frontend
const mapMongoStatusToFrontend = (status) => {
  if (!status) return 'EN_COURS';
  
  switch(status.toLowerCase()) {
    case 'en_cours':
      return 'EN_COURS';
    case 'termine':
      return 'TERMINÉ';
    case 'erreur':
      return 'ÉCHOUÉ';
    default:
      return status.toUpperCase();
  }
};

// Service d'exécution
const executionService = {
  // Récupérer toutes les exécutions
  getAllExecutions: async () => {
    // Désactiver le cache pour toujours afficher les données les plus récentes
    // Cela garantit que chaque exécution d'un agent est affichée, même si le même agent est exécuté plusieurs fois
    
    // Priorité aux données de MongoDB pour avoir l'historique complet et à jour
    try {
      const response = await fetch('http://localhost:8000/executions/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const apiExecutions = await response.json();
        console.log('Exécutions récupérées depuis MongoDB:', apiExecutions);
        
        // Transformer les données MongoDB au format attendu par le frontend
        const formattedExecutions = apiExecutions.map(exec => ({
          id: exec._id,
          agentId: exec.agent_id,
          startTime: exec.date_debut,
          endTime: exec.date_fin,
          status: mapMongoStatusToFrontend(exec.status),
          result: exec.resultats ? JSON.stringify(exec.resultats) : null,
          error: exec.erreur,
          fichiers: exec.fichiers
        }));
        
        // Trier les exécutions de la plus récente à la plus ancienne
        const sortedExecutions = formattedExecutions.sort((a, b) => {
          const dateA = new Date(a.startTime || 0);
          const dateB = new Date(b.startTime || 0);
          return dateB - dateA; // Tri décroissant (plus récent au plus ancien)
        });
        
        return sortedExecutions;
      } else {
        console.warn('Impossible de récupérer les exécutions depuis MongoDB, utilisation du localStorage');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des exécutions depuis MongoDB:', error);
      console.warn('Utilisation du localStorage comme fallback');
    }
    
    // Fallback sur localStorage si MongoDB n'est pas disponible
    if (USE_LOCAL_STORAGE) {
      const executions = localStorageService.getExecutions();
      return executions;
    } 
    
    // Si aucune des méthodes précédentes n'a fonctionné
    try {
      const response = await fetch(`${API_URL}/executions`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des exécutions:', error);
      return [];
    }
  },
  

  
  // Récupérer les exécutions d'un utilisateur
  getExecutionsByUserId: async (userId = getCurrentUserId()) => {
    if (!userId) return [];
    
    if (USE_LOCAL_STORAGE) {
      return localStorageService.getExecutionsByUserId(userId);
    }
    
    try {
      const response = await fetch(`${API_URL}/executions/user/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des exécutions de l\'utilisateur');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },
  
  // Récupérer les exécutions d'un agent
  getExecutionsByAgentId: async (agentId) => {
    if (!agentId) {
      console.error('ID d\'agent non fourni');
      return [];
    }
    
    if (USE_LOCAL_STORAGE) {
      return localStorageService.getExecutionsByAgentId(agentId);
    }
    
    try {
      const response = await fetch(`${API_URL}/executions/agent/${agentId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        console.warn(`Erreur HTTP: ${response.status} ${response.statusText}`);
        // Utiliser le localStorage comme solution de secours
        return localStorageService.getExecutionsByAgentId(agentId);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des exécutions de l\'agent:', error);
      // Utiliser le localStorage comme solution de secours
      return localStorageService.getExecutionsByAgentId(agentId);
    }
  },
  
  // Récupérer une exécution par son ID
  getExecutionById: async (id) => {
    if (USE_LOCAL_STORAGE) {
      return localStorageService.getExecutionById(id);
    }
    
    try {
      const response = await fetch(`${API_URL}/executions/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        console.warn(`Erreur HTTP: ${response.status} ${response.statusText}`);
        // Utiliser le localStorage comme solution de secours
        return localStorageService.getExecutionById(id);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'exécution:', error);
      // Utiliser le localStorage comme solution de secours
      return localStorageService.getExecutionById(id);
    }
  },
  
  // Démarrer une nouvelle exécution
  startExecution: async (agentId, data = {}) => {
    if (!agentId) {
      console.error('ID d\'agent non fourni');
      return null;
    }
    
    // Récupérer l'agent pour avoir ses informations
    const agent = await agentService.getAgentById(agentId);
    if (!agent) {
      console.error('Agent non trouvé');
      return null;
    }
    
    // Enregistrer la facture si elle est fournie dans les données
    if (data.invoice && data.invoice.fileData) {
      try {
        const invoiceData = {
          invoiceNumber: data.invoice.invoiceNumber || `INV-${Date.now()}`,
          clientName: data.invoice.clientName || agent.name,
          amount: data.invoice.amount || 0,
          dueDate: data.invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: data.invoice.description || `Facture pour ${agent.name}`,
          fileName: data.invoice.fileName || `facture_${Date.now()}.pdf`,
          fileType: data.invoice.fileType || 'application/pdf',
          fileData: data.invoice.fileData
        };
        
        await agentService.addInvoiceToAgent(agentId, invoiceData);
        console.log('Facture enregistrée avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la facture:', error);
      }
    }
    
    // Enregistrer l'ordre de mission s'il est fourni dans les données
    if (data.missionOrder && data.missionOrder.fileData) {
      try {
        const missionOrderData = {
          missionName: data.missionOrder.missionName || `Mission-${Date.now()}`,
          clientName: data.missionOrder.clientName || agent.name,
          startDate: data.missionOrder.startDate || new Date().toISOString(),
          endDate: data.missionOrder.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: data.missionOrder.description || `Ordre de mission pour ${agent.name}`,
          fileName: data.missionOrder.fileName || `ordre_mission_${Date.now()}.pdf`,
          fileType: data.missionOrder.fileType || 'application/pdf',
          fileData: data.missionOrder.fileData
        };
        
        await agentService.addMissionOrderToAgent(agentId, missionOrderData);
        console.log('Ordre de mission enregistré avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'ordre de mission:', error);
      }
    }
    
    // Créer une nouvelle exécution
    const execution = {
      id: Date.now().toString(), // Générer un ID unique
      agentId,
      userId: getCurrentUserId(), // Ajouter l'ID de l'utilisateur actuel
      status: 'RUNNING',
      startTime: new Date().toISOString(),
      endTime: null,
      results: {},
      ...data
    };
    
    if (USE_LOCAL_STORAGE) {
      return localStorageService.saveExecution(execution);
    }
    
    try {
      const response = await fetch(`${API_URL}/executions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(execution)
      });
      
      if (!response.ok) {
        console.warn(`Erreur HTTP: ${response.status} ${response.statusText}`);
        // Utiliser le localStorage comme solution de secours
        return localStorageService.saveExecution(execution);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'exécution:', error);
      // Utiliser le localStorage comme solution de secours
      return localStorageService.saveExecution(execution);
    }
  },
  
  // Mettre à jour le statut d'une exécution
  updateExecutionStatus: async (id, status, results = {}) => {
    if (!id) {
      console.error('ID d\'exécution non fourni');
      return null;
    }
    
    if (USE_LOCAL_STORAGE) {
      const execution = localStorageService.getExecutionById(id);
      if (!execution) return null;
      
      execution.status = status;
      execution.endTime = new Date().toISOString();
      execution.results = { ...execution.results, ...results };
      
      return localStorageService.saveExecution(execution);
    }
    
    try {
      const execution = await executionService.getExecutionById(id);
      if (!execution) return null;
      
      execution.status = status;
      execution.endTime = new Date().toISOString();
      execution.results = { ...execution.results, ...results };
      
      const response = await fetch(`${API_URL}/executions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(execution)
      });
      
      if (!response.ok) {
        console.warn(`Erreur HTTP: ${response.status} ${response.statusText}`);
        // Utiliser le localStorage comme solution de secours
        return localStorageService.saveExecution(execution);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'exécution:', error);
      
      // Essayer de mettre à jour en localStorage comme solution de secours
      try {
        const execution = localStorageService.getExecutionById(id);
        if (!execution) return null;
        
        execution.status = status;
        execution.endTime = new Date().toISOString();
        execution.results = { ...execution.results, ...results };
        
        return localStorageService.saveExecution(execution);
      } catch (e) {
        console.error('Erreur lors de la mise à jour en localStorage:', e);
        return null;
      }
    }
  },
  
  // Enregistrer les résultats d'analyse d'une exécution
  saveAnalysisResults: async (id, analysisResults) => {
    if (!id) {
      console.error('ID d\'exécution non fourni');
      return null;
    }
    
    if (!analysisResults) {
      console.error('Résultats d\'analyse non fournis');
      return null;
    }
    
    console.log('Enregistrement des résultats d\'analyse pour l\'exécution:', id);
    console.log('Résultats:', analysisResults);
    
    // Si nous utilisons le localStorage, mettre à jour l'exécution localement
    if (USE_LOCAL_STORAGE) {
      const execution = localStorageService.getExecutionById(id);
      if (!execution) {
        console.error('Exécution non trouvée dans le localStorage');
        return null;
      }
      
      execution.status = 'TERMINÉ';
      execution.endTime = new Date().toISOString();
      
      // Stocker les résultats d'analyse dans une collection séparée dans le localStorage
      const analysisResult = {
        id: `analysis_${Date.now()}`,
        executionId: id,
        agentId: execution.agentId,
        userId: execution.userId,
        createdAt: new Date().toISOString(),
        results: analysisResults
      };
      
      // Sauvegarder le résultat d'analyse dans le localStorage
      localStorageService.saveAnalysisResult(analysisResult);
      
      // Mettre à jour l'exécution
      return localStorageService.saveExecution(execution);
    }
    
    // Sinon, envoyer les résultats au backend
    try {
      // Envoyer les résultats au format JSON (qui inclut maintenant les champs structurés)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/analysis-results/execution/${id}`;
      console.log('Envoi des résultats au backend:', apiUrl);
      console.log('Résultats envoyés:', JSON.stringify(analysisResults, null, 2));
      
      // Formater les données dans le format exact attendu par le backend
      // Le backend attend un objet avec des champs spécifiques au premier niveau
      let formattedResults = {};
      
      // Vérifier si les résultats sont déjà dans le format attendu
      if (typeof analysisResults === 'object' && analysisResults !== null) {
        // Extraire les champs spécifiques
        if (analysisResults.fraude !== undefined) {
          // Les résultats sont déjà dans le bon format
          formattedResults = { ...analysisResults };
        } else if (Array.isArray(analysisResults) && analysisResults.length > 0) {
          // Si c'est un tableau, prendre le premier élément
          formattedResults = { ...analysisResults[0] };
        } else if (analysisResults.résultats && Array.isArray(analysisResults.résultats) && analysisResults.résultats.length > 0) {
          // Si les résultats sont dans une propriété 'résultats'
          formattedResults = { ...analysisResults.résultats[0] };
        } else {
          // Format inconnu, essayer d'extraire les champs connus
          formattedResults = {
            fraude: "Non",
            "Nom du commerce": "inconnu",
            "Date de la facture": "",
            "Montant total": 0,
            "Ville": "",
            "Adresse complète": "",
            raison: []
          };
          
          // Essayer d'extraire les champs connus de l'objet
          Object.keys(analysisResults).forEach(key => {
            if (key.toLowerCase().includes('fraude')) formattedResults.fraude = analysisResults[key];
            if (key.toLowerCase().includes('commerce')) formattedResults["Nom du commerce"] = analysisResults[key];
            if (key.toLowerCase().includes('date')) formattedResults["Date de la facture"] = analysisResults[key];
            if (key.toLowerCase().includes('montant')) formattedResults["Montant total"] = analysisResults[key];
            if (key.toLowerCase().includes('ville')) formattedResults.Ville = analysisResults[key];
            if (key.toLowerCase().includes('adresse')) formattedResults["Adresse complète"] = analysisResults[key];
            if (key.toLowerCase().includes('raison') && Array.isArray(analysisResults[key])) {
              formattedResults.raison = analysisResults[key];
            }
          });
        }
      } else {
        // Format invalide, utiliser un format par défaut
        formattedResults = {
          fraude: "Non",
          "Nom du commerce": "inconnu",
          "Date de la facture": "",
          "Montant total": 0,
          "Ville": "",
          "Adresse complète": "",
          raison: []
        };
      }
      
      // Ajouter un timestamp pour garantir que chaque enregistrement est unique
      formattedResults.timestamp = new Date().toISOString();
      
      console.log('Résultats formatés:', JSON.stringify(formattedResults, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(formattedResults)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur lors de l'enregistrement des résultats: ${response.status} - ${errorText}`);
        
        // Utiliser le localStorage comme solution de secours
        const execution = localStorageService.getExecutionById(id);
        if (execution) {
          execution.status = 'TERMINÉ';
          execution.endTime = new Date().toISOString();
          localStorageService.saveExecution(execution);
          
          // Stocker les résultats d'analyse dans une collection séparée dans le localStorage
          const analysisResult = {
            id: `analysis_${Date.now()}`,
            executionId: id,
            agentId: execution.agentId,
            userId: execution.userId,
            createdAt: new Date().toISOString(),
            results: analysisResults
          };
          
          // Sauvegarder le résultat d'analyse dans le localStorage
          return localStorageService.saveAnalysisResult(analysisResult);
        }
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des résultats d\'analyse:', error);
      
      // Essayer de mettre à jour en localStorage comme solution de secours
      try {
        const execution = localStorageService.getExecutionById(id);
        if (execution) {
          execution.status = 'TERMINÉ';
          execution.endTime = new Date().toISOString();
          localStorageService.saveExecution(execution);
          
          // Stocker les résultats d'analyse dans une collection séparée dans le localStorage
          const analysisResult = {
            id: `analysis_${Date.now()}`,
            executionId: id,
            agentId: execution.agentId,
            userId: execution.userId,
            createdAt: new Date().toISOString(),
            results: analysisResults
          };
          
          // Sauvegarder le résultat d'analyse dans le localStorage
          return localStorageService.saveAnalysisResult(analysisResult);
        }
        return null;
      } catch (e) {
        console.error('Erreur lors de la mise à jour en localStorage:', e);
        return null;
      }
    }
  },
  
  // Marquer une exécution comme échouée
  failExecution: async (id, errorMessage) => {
    if (!id) {
      console.error('ID d\'exécution non fourni');
      return null;
    }
    
    console.log('Marquage de l\'exécution comme échouée:', id);
    console.log('Message d\'erreur:', errorMessage);
    
    // Si nous utilisons le localStorage, mettre à jour l'exécution localement
    if (USE_LOCAL_STORAGE) {
      const execution = localStorageService.getExecutionById(id);
      if (!execution) {
        console.error('Exécution non trouvée dans le localStorage');
        return null;
      }
      
      execution.status = 'ÉCHOUÉ';
      execution.endTime = new Date().toISOString();
      execution.notes = errorMessage || 'Erreur inconnue';
      
      return localStorageService.saveExecution(execution);
    }
    
    // Sinon, envoyer la mise à jour au backend
    try {
      // Utiliser le nouvel endpoint pour marquer une exécution comme échouée
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/analysis-results/execution/${id}/fail`;
      console.log('Envoi de la mise à jour au backend:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST', // Changement de PUT à POST pour correspondre au nouvel endpoint
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('opti_agent_token') || ''}`
        },
        body: JSON.stringify({ error: errorMessage || 'Erreur inconnue' })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur lors de la mise à jour de l'exécution: ${response.status} - ${errorText}`);
        
        // Essayer l'ancien endpoint comme solution de secours
        try {
          const oldApiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/executions/${id}/fail`;
          console.log('Tentative avec l\'ancien endpoint:', oldApiUrl);
          
          const oldResponse = await fetch(oldApiUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('opti_agent_token') || ''}`
            },
            body: JSON.stringify({ error: errorMessage || 'Erreur inconnue' })
          });
          
          if (oldResponse.ok) {
            return await oldResponse.json();
          }
        } catch (oldError) {
          console.error('Erreur avec l\'ancien endpoint:', oldError);
        }
        
        // Utiliser le localStorage comme solution de secours finale
        const execution = localStorageService.getExecutionById(id) || {
          id,
          status: 'ÉCHOUÉ',
          endTime: new Date().toISOString(),
          notes: errorMessage || 'Erreur inconnue'
        };
        
        return localStorageService.saveExecution(execution);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'exécution:', error);
      
      // Essayer de mettre à jour en localStorage comme solution de secours
      try {
        const execution = localStorageService.getExecutionById(id) || {
          id,
          status: 'ÉCHOUÉ',
          endTime: new Date().toISOString(),
          notes: errorMessage || 'Erreur inconnue'
        };
        
        return localStorageService.saveExecution(execution);
      } catch (e) {
        console.error('Erreur lors de la mise à jour en localStorage:', e);
        return null;
      }
    }
  }
};

export { executionService };
