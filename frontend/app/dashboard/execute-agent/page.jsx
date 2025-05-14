"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, CheckCircle, FileText, Eye } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { agentService } from "@/lib/agent-service"
import { fileService } from "@/lib/file-service"
import { executionService } from "@/lib/execution-service"
import { userService } from "@/lib/user-service"

export default function ExecuteAgentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentId = searchParams.get("agentId")

  const [agent, setAgent] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [missionOrder, setMissionOrder] = useState(null)
  const [error, setError] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [executionResults, setExecutionResults] = useState(null)
  const [currentExecution, setCurrentExecution] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("documents")

  // Effet pour basculer vers l'onglet Résultats lorsque les résultats sont disponibles
  useEffect(() => {
    if (executionResults) {
      console.log("Résultats disponibles, basculement vers l'onglet Résultats");
      setActiveTab("results");
    }
  }, [executionResults]);

  // Effet pour charger les données de l'agent, les factures et l'ordre de mission
  useEffect(() => {
    const fetchData = async () => {
      // Récupérer l'ID de l'agent depuis les paramètres d'URL ou le localStorage
      let currentAgentId = agentId;
      
      // Si l'ID n'est pas disponible dans l'URL, essayer de le récupérer depuis le localStorage
      if (!currentAgentId) {
        currentAgentId = localStorage.getItem('lastCreatedAgentId');
        console.log("ID d'agent récupéré depuis localStorage:", currentAgentId);
        
        // Si un ID a été récupéré du localStorage, mettre à jour l'URL pour refléter cet ID
        if (currentAgentId) {
          window.history.replaceState(
            null, 
            '', 
            `/dashboard/execute-agent?agentId=${currentAgentId}`
          );
        }
      }
      
      if (!currentAgentId) {
        setError("ID d'agent non spécifié");
        setIsLoading(false);
        return;
      }
      
      // Vérifier d'abord si nous avons des fichiers originaux dans localStorage
      let originalInvoices = [];
      let originalMissionOrder = null;
      
      if (typeof window !== 'undefined') {
        // Récupérer les factures originales depuis localStorage
        const storedInvoices = localStorage.getItem('executeAgent_invoices');
        if (storedInvoices) {
          try {
            const parsedInvoices = JSON.parse(storedInvoices);
            originalInvoices = parsedInvoices.map(inv => ({
              id: `original_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              name: inv.name, // Nom original du fichier
              fileType: inv.fileType,
              fileDataBase64: inv.fileDataBase64,
              isOriginal: true
            }));
            console.log("Factures originales récupérées depuis localStorage:", originalInvoices.map(f => f.name));
          } catch (error) {
            console.error("Erreur lors de la récupération des factures depuis localStorage:", error);
          }
        }
        
        // Récupérer l'ordre de mission original depuis localStorage
        const storedMissionOrder = localStorage.getItem('executeAgent_missionOrder');
        if (storedMissionOrder) {
          try {
            const ord = JSON.parse(storedMissionOrder);
            originalMissionOrder = {
              id: `original_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              name: ord.name, // Nom original du fichier
              fileType: ord.fileType,
              fileDataBase64: ord.fileDataBase64,
              isOriginal: true
            };
            console.log("Ordre de mission original récupéré depuis localStorage:", originalMissionOrder.name);
          } catch (error) {
            console.error("Erreur lors de la récupération de l'ordre de mission depuis localStorage:", error);
          }
        }
      }

      try {
        setIsLoading(true);
        setError("");
        
        console.log("Tentative de chargement de l'agent avec ID:", currentAgentId);
        
        // Charger les informations de l'agent
        try {
          const agentData = await agentService.getAgentById(currentAgentId);
          
          if (!agentData) {
            throw new Error("Agent non trouvé");
          }
          setAgent(agentData);
          console.log("Agent chargé avec succès:", agentData);
        } catch (error) {
          console.error("Erreur lors du chargement de l'agent:", error);
          setError("Impossible de charger les informations de l'agent");
          setIsLoading(false);
          return;
        }
        
        // Utiliser d'abord les fichiers originaux du localStorage s'ils existent
        if (originalInvoices.length > 0) {
          setInvoices(originalInvoices);
          console.log("Utilisation des factures originales du localStorage:", originalInvoices.map(f => f.name));
        } else {
          // Sinon, charger les factures via l'API
          try {
            const invoiceFiles = await fileService.getInvoiceFilesByAgentId(currentAgentId);
            
            if (invoiceFiles && invoiceFiles.length > 0) {
              setInvoices(invoiceFiles);
              console.log("Factures chargées via l'API:", invoiceFiles);
            } else {
              console.log("Aucune facture trouvée pour l'agent:", currentAgentId);
            }
          } catch (error) {
            console.error("Erreur lors du chargement des factures:", error);
          }
        }
        
        // Utiliser d'abord l'ordre de mission original du localStorage s'il existe
        if (originalMissionOrder) {
          setMissionOrder(originalMissionOrder);
          console.log("Utilisation de l'ordre de mission original du localStorage:", originalMissionOrder.name);
        } else {
          // Sinon, charger l'ordre de mission via l'API
          try {
            const missionOrderFile = await fileService.getMissionOrderByAgentId(currentAgentId);
            
            if (missionOrderFile) {
              setMissionOrder(missionOrderFile);
              console.log("Ordre de mission chargé via l'API:", missionOrderFile);
            } else {
              console.log("Aucun ordre de mission trouvé pour l'agent:", currentAgentId);
            }
          } catch (error) {
            console.error("Erreur lors du chargement de l'ordre de mission:", error);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Erreur lors du chargement des données");
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [agentId, router]);

  // Fonction pour exécuter l'agent
  const handleExecuteAgent = async () => {
    // Vérifier si l'utilisateur est connecté
    const userStr = localStorage.getItem('opti_agent_user');
    if (!userStr) {
      console.log("Utilisateur non connecté, redirection vers la page de connexion");
      router.push('/auth/login');
      return;
    }

    if (!agent) {
      setError("Aucun agent sélectionné");
      return;
    }

    if (invoices.length === 0) {
      setError("Aucune facture disponible pour l'exécution");
      return;
    }

    if (!missionOrder) {
      setError("Aucun ordre de mission disponible pour l'exécution");
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(10);
    setError("");
    
    // Créer une nouvelle exécution dans la base de données
    try {
      const newExecution = await executionService.startExecution(agent.id);
      console.log("Nouvelle exécution créée:", newExecution);
      setCurrentExecution(newExecution);
    } catch (error) {
      console.error("Erreur lors de la création de l'exécution:", error);
      // Continuer même si l'enregistrement de l'exécution a échoué
    }

    try {
      console.log("Début de l'exécution de l'agent:", agent.id);
      
      // Progression de l'exécution
      setExecutionProgress(30);
      console.log("Préparation des données pour l'API Spring...");
      
      // Préparer les fichiers pour l'envoi à Spring
      let invoiceFiles = [];
      let missionOrderFile = null;
      
      // Vérifier si nous avons des fichiers originaux dans l'état actuel
      const originalInvoices = invoices.filter(inv => inv.isOriginal);
      const originalMissionOrder = missionOrder && missionOrder.isOriginal ? missionOrder : null;
      
      // Si nous avons des fichiers originaux dans l'état, les convertir en objets File
      if (originalInvoices.length > 0) {
        console.log("Utilisation des factures originales de l'état:", originalInvoices.map(f => f.name));
        invoiceFiles = originalInvoices.map(inv => {
          const arr = inv.fileDataBase64.split(',');
          const mime = inv.fileType;
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while(n--){
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new File([u8arr], inv.name, {type: mime});
        });
      }
      
      if (originalMissionOrder) {
        console.log("Utilisation de l'ordre de mission original de l'état:", originalMissionOrder.name);
        const arr = originalMissionOrder.fileDataBase64.split(',');
        const mime = originalMissionOrder.fileType;
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
          u8arr[n] = bstr.charCodeAt(n);
        }
        missionOrderFile = new File([u8arr], originalMissionOrder.name, {type: mime});
      }
      
      // Si nous n'avons pas de fichiers originaux dans l'état, essayer de les récupérer depuis localStorage
      if (invoiceFiles.length === 0 && typeof window !== 'undefined') {
        const storedInvoices = localStorage.getItem('executeAgent_invoices');
        if (storedInvoices) {
          try {
            const parsedInvoices = JSON.parse(storedInvoices);
            invoiceFiles = parsedInvoices.map(inv => {
              const arr = inv.fileDataBase64.split(',');
              const mime = inv.fileType;
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while(n--){
                u8arr[n] = bstr.charCodeAt(n);
              }
              return new File([u8arr], inv.name, {type: mime});
            });
            console.log("Factures récupérées depuis localStorage:", invoiceFiles.map(f => f.name));
          } catch (error) {
            console.error("Erreur lors de la récupération des factures depuis localStorage:", error);
          }
        }
      }
      
      if (!missionOrderFile && typeof window !== 'undefined') {
        const storedMissionOrder = localStorage.getItem('executeAgent_missionOrder');
        if (storedMissionOrder) {
          try {
            const ord = JSON.parse(storedMissionOrder);
            const arr = ord.fileDataBase64.split(',');
            const mime = ord.fileType;
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--){
              u8arr[n] = bstr.charCodeAt(n);
            }
            missionOrderFile = new File([u8arr], ord.name, {type: mime});
            console.log("Ordre de mission récupéré depuis localStorage:", missionOrderFile.name);
          } catch (error) {
            console.error("Erreur lors de la récupération de l'ordre de mission depuis localStorage:", error);
          }
        }
      }
      
      // En dernier recours, récupérer les fichiers via l'API
      if (invoiceFiles.length === 0) {
        console.log("Aucune facture originale trouvée, récupération via l'API...");
        const invoicePromises = invoices.map(async (invoice) => {
          try {
            // Récupérer le contenu binaire de la facture
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/files/invoices/${invoice.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('opti_agent_token') || ''}`
              }
            });
            
            if (!response.ok) {
              console.error(`Erreur lors de la récupération de la facture ${invoice.id}: ${response.status}`);
              return null;
            }
            
            // Convertir la réponse en blob
            const blob = await response.blob();
            // Créer un fichier à partir du blob
            return new File([blob], invoice.name, { type: invoice.fileType });
          } catch (error) {
            console.error(`Erreur lors de la récupération de la facture ${invoice.id}:`, error);
            return null;
          }
        });
        
        invoiceFiles = (await Promise.all(invoicePromises)).filter(file => file !== null);
      }
      
      if (!missionOrderFile) {
        console.log("Aucun ordre de mission original trouvé, récupération via l'API...");
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/files/mission-orders/${missionOrder.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('opti_agent_token') || ''}`
            }
          });
          
          if (!response.ok) {
            console.error(`Erreur lors de la récupération de l'ordre de mission ${missionOrder.id}: ${response.status}`);
          } else {
            // Convertir la réponse en blob
            const blob = await response.blob();
            // Créer un fichier à partir du blob
            missionOrderFile = new File([blob], missionOrder.name, { type: missionOrder.fileType });
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération de l'ordre de mission ${missionOrder.id}:`, error);
        }
      }
      
      // Vérifier que nous avons bien les fichiers nécessaires
      setExecutionProgress(50);
      
      if (invoiceFiles.length === 0) {
        throw new Error("Impossible de récupérer les factures");
      }
      
      if (!missionOrderFile) {
        throw new Error("Impossible de récupérer l'ordre de mission");
      }
      
      setExecutionProgress(70);
      console.log("Préparation des données pour l'API Spring...");
      
      // Vérifier les fichiers avant l'envoi
      console.log("Factures à envoyer:", invoiceFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      })));
      
      if (missionOrderFile) {
        console.log("Ordre de mission à envoyer:", {
          name: missionOrderFile.name,
          type: missionOrderFile.type,
          size: missionOrderFile.size
        });
      }
      
      // Créer un FormData pour envoyer les fichiers à Spring
      const formData = new FormData();
      
      // Ajouter l'ID de l'agent
      if (agent && agent.id) {
        console.log("Ajout de l'ID de l'agent:", agent.id);
        formData.append('agent_id', agent.id);
      } else if (agentId) {
        console.log("Ajout de l'ID de l'agent depuis les paramètres:", agentId);
        formData.append('agent_id', agentId);
      }
      
      // Ajouter les factures
      invoiceFiles.forEach((file, index) => {
        console.log(`Ajout de la facture ${index + 1}:`, file.name);
        formData.append('factures', file);
      });
      
      // Ajouter l'ordre de mission
      if (missionOrderFile) {
        console.log("Ajout de l'ordre de mission:", missionOrderFile.name);
        formData.append('ordre_mission', missionOrderFile);
      }

      // Debug: Afficher le contenu du FormData
      console.log("Contenu du FormData:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1].name, pair[1].type, pair[1].size);
      }
      
      // URL de l'API FastAPI
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/detecter_fraude/`;
      console.log("Envoi des données à l'API Spring:", apiUrl);
      
      try {
        // Récupérer le token d'autorisation depuis l'objet utilisateur
        const userStr = localStorage.getItem('opti_agent_user');
        if (!userStr) {
          console.error("Utilisateur non connecté, redirection vers la page de connexion");
          router.push('/auth/login');
          return;
        }

        const user = JSON.parse(userStr);
        if (!user || !user.token) {
          console.error("Token non trouvé dans les données utilisateur, redirection vers la page de connexion");
          router.push('/auth/login');
          return;
        }

        console.log("Envoi de la requête avec le token:", user.token.substring(0, 10) + "...");
        
        // Vérifier les fichiers avant l'envoi
        console.log("Détails des fichiers à envoyer:");
        console.log("Nombre de factures:", invoiceFiles.length);
        invoiceFiles.forEach((file, index) => {
          console.log(`Facture ${index + 1}:`, {
            name: file.name,
            type: file.type,
            size: file.size
          });
        });
        
        if (missionOrderFile) {
          console.log("Ordre de mission:", {
            name: missionOrderFile.name,
            type: missionOrderFile.type,
            size: missionOrderFile.size
          });
        }
        
        // Envoyer la requête à l'API Spring
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        setExecutionProgress(90);
        
        if (!response.ok) {
          let errorMessage;
          console.log("Statut de la réponse:", response.status);
          console.log("Headers de la réponse:", Object.fromEntries(response.headers.entries()));
          
          try {
            const errorData = await response.json();
            console.log("Données d'erreur:", errorData);
            errorMessage = errorData.message || 'Une erreur est survenue';
          } catch (e) {
            console.log("Erreur lors de la lecture du JSON:", e);
            // Si la réponse n'est pas du JSON, on utilise le statut HTTP
            errorMessage = `Erreur HTTP ${response.status}`;
          }
          
          console.error("Réponse d'erreur complète:", errorMessage);
          throw new Error(`Erreur lors de l'analyse: ${response.status} - ${errorMessage}`);
        }
        
        // Récupérer les résultats
        const results = await response.json();
        console.log("Résultats de l'analyse:", results);
        
        // Enregistrer les résultats dans la base de données si une exécution a été créée
        if (currentExecution && currentExecution.id) {
          try {
            const updatedExecution = await executionService.saveAnalysisResults(currentExecution.id, results);
            console.log("Résultats enregistrés dans la base de données:", updatedExecution);
            
            // Récupérer l'ID de l'utilisateur actuel
            const userStr = localStorage.getItem('opti_agent_user');
            if (userStr) {
              try {
                const user = JSON.parse(userStr);
                // Rafraîchir les statistiques utilisateur
                await userService.getUserStats(user.id);
                console.log("Statistiques utilisateur mises à jour");
              } catch (e) {
                console.error("Erreur lors du parsing de l'utilisateur:", e);
              }
            }
          } catch (error) {
            console.error("Erreur lors de l'enregistrement des résultats:", error);
            // Continuer même si l'enregistrement des résultats a échoué
          }
        } else {
          console.warn("Impossible d'enregistrer les résultats: aucune exécution en cours");
        }
        
        setExecutionProgress(100);
        setExecutionResults(results);
        setIsExecuting(false);
        
        // Basculer automatiquement vers l'onglet Résultats
        setActiveTab("results");
      } catch (error) {
        console.error("Erreur lors de la connexion à l'API Spring:", error);
        setError(`Impossible de se connecter à l'API Spring. Vérifiez que le serveur est en cours d'exécution sur ${apiUrl}`);
        
        // Marquer l'exécution comme échouée si elle existe
        if (currentExecution && currentExecution.id) {
          try {
            await executionService.failExecution(currentExecution.id, error.message || "Erreur de connexion à l'API Spring");
            console.log("Exécution marquée comme échouée");
            
            // Récupérer l'ID de l'utilisateur actuel
            const userStr = localStorage.getItem('opti_agent_user');
            if (userStr) {
              try {
                const user = JSON.parse(userStr);
                // Rafraîchir les statistiques utilisateur
                await userService.getUserStats(user.id);
                console.log("Statistiques utilisateur mises à jour");
              } catch (e) {
                console.error("Erreur lors du parsing de l'utilisateur:", e);
              }
            }
          } catch (execError) {
            console.error("Erreur lors de la mise à jour du statut de l'exécution:", execError);
          }
        }
        
        setIsExecuting(false);
        // Ne pas relancer l'erreur, on la gère ici
      }
    } catch (error) {
      console.error("Erreur lors de l'exécution de l'agent:", error);
      setError(`Une erreur s'est produite lors de l'exécution de l'agent: ${error.message}`);
      
      // Marquer l'exécution comme échouée si elle existe
      if (currentExecution && currentExecution.id) {
        try {
          await executionService.failExecution(currentExecution.id, error.message || "Erreur lors de l'exécution de l'agent");
          console.log("Exécution marquée comme échouée");
          
          // Récupérer l'ID de l'utilisateur actuel
          const userStr = localStorage.getItem('opti_agent_user');
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              // Rafraîchir les statistiques utilisateur
              await userService.getUserStats(user.id);
              console.log("Statistiques utilisateur mises à jour");
            } catch (e) {
              console.error("Erreur lors du parsing de l'utilisateur:", e);
            }
          }
        } catch (execError) {
          console.error("Erreur lors de la mise à jour du statut de l'exécution:", execError);
        }
      }
      
      setIsExecuting(false);
    }
  };

  // Fonction pour afficher une facture
  const handleViewInvoice = (invoiceId) => {
    console.log("Affichage de la facture:", invoiceId);
    // Ici, vous pourriez ouvrir une modal ou rediriger vers une page de visualisation
  };

  // Fonction pour afficher l'ordre de mission
  const handleViewMissionOrder = () => {
    if (missionOrder) {
      console.log("Affichage de l'ordre de mission:", missionOrder.id);
      // Ici, vous pourriez ouvrir une modal ou rediriger vers une page de visualisation
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Exécuter l'agent</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Chargement des données...</p>
        </div>
      ) : (
        <>
          {agent && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Détails de l'agent</CardTitle>
                <CardDescription>Informations sur l'agent à exécuter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <Label className="font-medium">Nom</Label>
                    <p>{agent.name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Description</Label>
                    <p>{agent.description || "Aucune description"}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Date de création</Label>
                    <p>{new Date(agent.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="results">Résultats</TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <div className="grid gap-6">
                {/* Factures */}
                <Card>
                  <CardHeader>
                    <CardTitle>Factures</CardTitle>
                    <CardDescription>Factures associées à cet agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {invoices && invoices.length > 0 ? (
                      <div className="space-y-2">
                        {invoices.map((invoice, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="text-sm truncate max-w-[180px]">{invoice.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInvoice(invoice.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Aucune facture disponible</p>
                    )}
                  </CardContent>
                </Card>

                {/* Ordre de mission */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ordre de mission</CardTitle>
                    <CardDescription>Ordre de mission associé à cet agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {missionOrder ? (
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm truncate max-w-[180px]">{missionOrder.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleViewMissionOrder}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Aucun ordre de mission disponible</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Résultats de l'analyse</CardTitle>
                  <CardDescription>Résultats de l'exécution de l'agent</CardDescription>
                </CardHeader>
                <CardContent>
                  {isExecuting ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Analyse en cours...</p>
                      <Progress value={executionProgress} max={100} />
                    </div>
                  ) : executionResults ? (
                    <div className="space-y-6">
                      {executionResults.résultats && executionResults.résultats.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Résultats de l'analyse</h3>
                          <div className="space-y-2">
                            {executionResults.résultats.map((result, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-md">
                                <div className="flex justify-between mb-2">
                                  <span className="font-medium">{result.nom_fichier}</span>
                                  <span className={`text-sm px-2 py-1 rounded-full ${result.fraude === 'Oui' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {result.fraude}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-sm font-medium">Nom du commerce</Label>
                                    <p className="text-sm">{result["Nom du commerce"]}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Date de la facture</Label>
                                    <p className="text-sm">{result["Date de la facture"]}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Montant total</Label>
                                    <p className="text-sm">{result["Montant total"]}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Ville</Label>
                                    <p className="text-sm">{result.Ville}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Adresse complète</Label>
                                    <p className="text-sm">{result["Adresse complète"]}</p>
                                  </div>
                                </div>
                                {result.raison && result.raison.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="text-sm font-medium mb-2">Raisons de la fraude</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                      {result.raison.map((reason, index) => (
                                        <li key={index} className="text-sm">{reason}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Aucun résultat disponible</p>
                      <Button 
                        onClick={handleExecuteAgent}
                        disabled={!agent || invoices.length === 0 || !missionOrder}
                      >
                        Exécuter l'agent
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {!executionResults && !isExecuting && (
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleExecuteAgent}
                disabled={!agent || invoices.length === 0 || !missionOrder || isExecuting}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exécution en cours...
                  </>
                ) : (
                  "Exécuter l'agent"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
