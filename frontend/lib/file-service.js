// Service pour la gestion des fichiers (factures et ordres de mission)

const API_URL = 'http://localhost:8081/api';
const USE_LOCAL_STORAGE = false; // Utiliser l'API pour enregistrer dans la base de données MongoDB

// Fonction utilitaire pour obtenir les en-têtes d'authentification
const getAuthHeaders = () => {
  const headers = {};
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Fonctions pour le localStorage (mode dégradé)
const localStorageService = {
  // Factures
  uploadInvoiceFile: (file, agentId) => {
    const invoices = JSON.parse(localStorage.getItem(`invoices_${agentId}`) || '[]');
    
    const newInvoice = {
      id: Date.now().toString(),
      fileName: file.name,
      fileType: file.type,
      agentId: agentId,
      uploadDate: new Date().toISOString()
    };
    
    localStorage.setItem(`invoices_${agentId}`, JSON.stringify([...invoices, newInvoice]));
    return newInvoice;
  },
  
  getInvoiceFilesByAgentId: (agentId) => {
    return JSON.parse(localStorage.getItem(`invoices_${agentId}`) || '[]');
  },
  
  getInvoiceFileById: (fileId) => {
    // Trouver à quel agent appartient ce fichier
    const allAgents = JSON.parse(localStorage.getItem('agents') || '[]');
    
    for (const agent of allAgents) {
      const invoices = JSON.parse(localStorage.getItem(`invoices_${agent.id}`) || '[]');
      const file = invoices.find(file => file.id === fileId);
      
      if (file) {
        return file;
      }
    }
    
    return null;
  },
  
  deleteInvoiceFile: (fileId) => {
    // Trouver à quel agent appartient ce fichier
    const allAgents = JSON.parse(localStorage.getItem('agents') || '[]');
    
    for (const agent of allAgents) {
      const invoices = JSON.parse(localStorage.getItem(`invoices_${agent.id}`) || '[]');
      const fileIndex = invoices.findIndex(file => file.id === fileId);
      
      if (fileIndex !== -1) {
        // Supprimer le fichier
        invoices.splice(fileIndex, 1);
        localStorage.setItem(`invoices_${agent.id}`, JSON.stringify(invoices));
        return true;
      }
    }
    
    return false;
  },
  
  // Ordres de mission
  uploadMissionOrder: (file, agentId) => {
    const missionOrder = {
      id: Date.now().toString(),
      fileName: file.name,
      fileType: file.type,
      agentId: agentId,
      uploadDate: new Date().toISOString()
    };
    
    localStorage.setItem(`missionOrder_${agentId}`, JSON.stringify(missionOrder));
    return missionOrder;
  },
  
  getMissionOrderByAgentId: (agentId) => {
    const missionOrder = localStorage.getItem(`missionOrder_${agentId}`);
    return missionOrder ? JSON.parse(missionOrder) : null;
  },
  
  getMissionOrderById: (fileId) => {
    // Trouver à quel agent appartient ce fichier
    const allAgents = JSON.parse(localStorage.getItem('agents') || '[]');
    
    for (const agent of allAgents) {
      const missionOrderStr = localStorage.getItem(`missionOrder_${agent.id}`);
      if (missionOrderStr) {
        const missionOrder = JSON.parse(missionOrderStr);
        if (missionOrder.id === fileId) {
          return missionOrder;
        }
      }
    }
    
    return null;
  },
  
  deleteMissionOrder: (fileId, agentId) => {
    // Supprimer l'ordre de mission
    localStorage.removeItem(`missionOrder_${agentId}`);
    return true;
  }
};

export const fileService = {
  // Méthodes pour les factures
  uploadInvoiceFile: async (fileData, agentId) => {
    if (USE_LOCAL_STORAGE) {
      return localStorageService.uploadInvoiceFile(fileData, agentId);
    }
    
    try {
      // Si fileData est un objet File, le convertir en base64
      let base64Data = fileData;
      if (fileData instanceof File) {
        base64Data = await readFileAsBase64(fileData);
      }
      
      // Utiliser le nouvel endpoint pour l'upload de fichier en base64
      const response = await fetch(`${API_URL}/files/invoices/base64/${agentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: fileData instanceof File ? fileData.name : 'invoice.pdf',
          fileType: fileData instanceof File ? fileData.type : 'application/pdf'
        })
      });
      
      if (!response.ok) {
        console.error(`Erreur lors de l'upload de la facture: ${response.status} ${response.statusText}`);
        // En cas d'erreur, utiliser le localStorage comme fallback
        return localStorageService.uploadInvoiceFile(fileData, agentId);
      }
      
      // Vérifier si la réponse est vide
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn("Réponse vide du serveur, utilisation du localStorage comme fallback");
        return localStorageService.uploadInvoiceFile(fileData, agentId);
      }
      
      // Essayer de parser le JSON
      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        console.error('Erreur lors du parsing de la réponse JSON:', parseError);
        // En cas d'erreur de parsing, utiliser le localStorage comme fallback
        return localStorageService.uploadInvoiceFile(fileData, agentId);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload de la facture:', error);
      // En cas d'erreur, utiliser le localStorage comme fallback
      return localStorageService.uploadInvoiceFile(fileData, agentId);
    }
  },
  
  getInvoiceFilesByAgentId: async (agentId) => {
    if (USE_LOCAL_STORAGE) {
      return localStorageService.getInvoiceFilesByAgentId(agentId);
    }
    
    try {
      const response = await fetch(`${API_URL}/files/invoices/agent/${agentId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Si aucune facture n'est trouvée, retourner un tableau vide au lieu de lancer une erreur
          return [];
        }
        throw new Error(`Failed to fetch invoices: ${response.status} ${response.statusText}`);
      }
      
      // Vérifier si la réponse est vide
      const text = await response.text();
      if (!text || text.trim() === '') {
        return [];
      }
      
      // Essayer de parser le JSON
      try {
        const invoices = JSON.parse(text);
        
        // Filtrer les factures par défaut (comme invoice.pdf)
        return invoices.filter(invoice => 
          invoice && 
          invoice.fileName && 
          !invoice.fileName.toLowerCase().includes('invoice.pdf')
        );
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  },
  
  getInvoiceFileById: async (fileId) => {
    if (USE_LOCAL_STORAGE) {
      return localStorageService.getInvoiceFileById(fileId);
    }
    
    try {
      const response = await fetch(`${API_URL}/files/invoices/${fileId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  },
  
  getInvoiceFileDownloadUrl: (fileId) => {
    return `${API_URL}/files/invoices/${fileId}`;
  },
  
  deleteInvoiceFile: async (fileId) => {
    if (USE_LOCAL_STORAGE) {
      return localStorageService.deleteInvoiceFile(fileId);
    }
    
    try {
      const response = await fetch(`${API_URL}/files/invoices/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete invoice: ${response.status} ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },
  
  // Méthodes pour les ordres de mission
  uploadMissionOrder: async (fileData, agentId) => {
    if (!agentId) {
      console.error('ID d\'agent non fourni pour l\'upload de l\'ordre de mission');
      throw new Error('ID d\'agent requis');
    }
    
    if (USE_LOCAL_STORAGE) {
      return localStorageService.uploadMissionOrder(fileData, agentId);
    }
    
    try {
      console.log("Début de l'upload de l'ordre de mission pour l'agent:", agentId);
      
      // Si fileData est un objet File, le convertir en base64
      let fileDataBase64 = fileData;
      if (fileData instanceof File) {
        fileDataBase64 = await readFileAsBase64(fileData);
      }
      
      // Extraire le type MIME et le nom du fichier
      let fileType = 'application/octet-stream';
      let fileName = 'mission_order.pdf';
      
      if (fileData instanceof File) {
        fileType = fileData.type || fileType;
        fileName = fileData.name || fileName;
      }
      
      // Créer l'objet de données à envoyer
      const requestData = {
        fileData: fileDataBase64,
        fileName: fileName,
        fileType: fileType,
        agentId: agentId,
        uploadDate: new Date().toISOString()
      };
      
      console.log("Envoi de l'ordre de mission avec les données:", {
        fileName: requestData.fileName,
        fileType: requestData.fileType,
        agentId: requestData.agentId
      });
      
      const response = await fetch(`${API_URL}/files/mission-orders`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur lors de l'upload de l'ordre de mission:", errorText);
        throw new Error(`Erreur lors de l'upload de l'ordre de mission: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Ordre de mission uploadé avec succès:", result);
      return result;
    } catch (error) {
      console.error("Erreur lors de l'upload de l'ordre de mission:", error);
      throw error;
    }
  },
  
  async getMissionOrderByAgentId(agentId) {
    try {
      console.log("Début de la récupération de l'ordre de mission pour l'agent:", agentId);
      
      // Vérifier que l'ID de l'agent est valide
      if (!agentId) {
        console.error("ID d'agent invalide pour la récupération de l'ordre de mission");
        return null;
      }
      
      const response = await fetch(`${API_URL}/files/mission-orders/agent/${agentId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log("Réponse brute de l'API pour l'ordre de mission:", response);
      console.log("Status de la réponse:", response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Si l'ordre de mission n'existe pas, retourner null au lieu d'une erreur
          console.log("Aucun ordre de mission trouvé pour l'agent:", agentId);
          return null;
        }
        console.error(`Erreur lors de la récupération de l'ordre de mission: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch mission order: ${response.status} ${response.statusText}`);
      }
      
      // Vérifier si la réponse est vide
      const text = await response.text();
      console.log("Texte de la réponse pour l'ordre de mission:", text);
      
      if (!text || text.trim() === '') {
        console.log("Réponse vide lors de la récupération de l'ordre de mission");
        return null;
      }
      
      // Essayer de parser le JSON
      try {
        const missionOrder = JSON.parse(text);
        console.log("Ordre de mission récupéré avec succès:", missionOrder);
        
        // Vérifier si l'ordre de mission a toutes les propriétés nécessaires
        if (!missionOrder.id) {
          console.warn("L'ordre de mission récupéré n'a pas d'ID");
          return null;
        }
        
        if (!missionOrder.fileName) {
          console.warn("L'ordre de mission récupéré n'a pas de nom de fichier");
          missionOrder.fileName = "ordre_mission.pdf";
        }
        
        if (!missionOrder.fileType) {
          console.warn("L'ordre de mission récupéré n'a pas de type de fichier");
          missionOrder.fileType = "application/pdf";
        }
        
        return missionOrder;
      } catch (parseError) {
        console.error('Erreur lors du parsing de la réponse JSON:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ordre de mission:', error);
      return null;
    }
  },
  
  getMissionOrderById: async (fileId) => {
    if (USE_LOCAL_STORAGE) {
      return localStorageService.getMissionOrderById(fileId);
    }
    
    try {
      const response = await fetch(`${API_URL}/files/mission-orders/${fileId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch mission order: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching mission order:', error);
      throw error;
    }
  },
  
  getMissionOrderDownloadUrl: (fileId) => {
    return `${API_URL}/files/mission-orders/${fileId}`;
  },
  
  deleteMissionOrder: async (fileId, agentId) => {
    if (USE_LOCAL_STORAGE) {
      return localStorageService.deleteMissionOrder(fileId, agentId);
    }
    
    try {
      const response = await fetch(`${API_URL}/files/mission-orders/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete mission order: ${response.status} ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting mission order:', error);
      throw error;
    }
  },
  
  uploadInvoice: async (fileDataBase64, agentId) => {
    try {
      console.log("Début de l'upload de la facture pour l'agent:", agentId);
      
      // Vérifier que l'ID de l'agent est valide
      if (!agentId) {
        console.error("ID d'agent invalide pour l'upload de facture");
        return null;
      }
      
      // Préparer les données pour l'API
      const fileData = {
        fileData: fileDataBase64,
        fileName: `invoice_${Date.now()}.pdf`,
        fileType: "application/pdf"
      };
      
      // Envoyer la requête à l'API
      const response = await fetch(`${API_URL}/files/invoices/base64/${agentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(fileData)
      });
      
      console.log("Réponse de l'API pour l'upload de facture:", response.status);
      
      if (!response.ok) {
        console.error(`Erreur lors de l'upload de la facture: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const invoice = await response.json();
      console.log("Facture uploadée avec succès:", invoice);
      
      // Associer la facture à l'agent
      const invoiceData = {
        invoiceNumber: `INV-${Date.now()}`,
        amount: 0,
        dueDate: new Date().toISOString(),
        description: "Facture",
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        fileData: fileDataBase64
      };
      
      const agentResponse = await fetch(`${API_URL}/agents/${agentId}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(invoiceData)
      });
      
      if (!agentResponse.ok) {
        console.error(`Erreur lors de l'association de la facture à l'agent: ${agentResponse.status} ${agentResponse.statusText}`);
      } else {
        console.log("Facture associée à l'agent avec succès");
      }
      
      return invoice;
    } catch (error) {
      console.error("Erreur lors de l'upload de la facture:", error);
      return null;
    }
  },
  
  uploadMissionOrder: async (fileDataBase64, agentId) => {
    try {
      console.log("Début de l'upload de l'ordre de mission pour l'agent:", agentId);
      
      // Vérifier que l'ID de l'agent est valide
      if (!agentId) {
        console.error("ID d'agent invalide pour l'upload de l'ordre de mission");
        return null;
      }
      
      // Préparer les données pour l'API
      const fileData = {
        fileData: fileDataBase64,
        fileName: `mission_order_${Date.now()}.pdf`,
        fileType: "application/pdf",
        missionName: `Mission-${Date.now()}`,
        clientName: "Client",
        description: "Ordre de mission"
      };
      
      // Envoyer la requête à l'API
      const response = await fetch(`${API_URL}/files/mission-orders/base64/${agentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(fileData)
      });
      
      console.log("Réponse de l'API pour l'upload de l'ordre de mission:", response.status);
      
      if (!response.ok) {
        console.error(`Erreur lors de l'upload de l'ordre de mission: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const missionOrder = await response.json();
      console.log("Ordre de mission uploadé avec succès:", missionOrder);
      
      return missionOrder;
    } catch (error) {
      console.error("Erreur lors de l'upload de l'ordre de mission:", error);
      return null;
    }
  },
};

// Fonction utilitaire pour lire un fichier en tant qu'ArrayBuffer
const readFileAsArrayBuffer = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(file);
  });
};

// Fonction utilitaire pour lire un fichier en tant que base64
const readFileAsBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsDataURL(file);
  });
};
