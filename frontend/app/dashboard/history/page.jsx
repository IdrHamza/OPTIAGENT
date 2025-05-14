"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Calendar, Bot, Loader2, Clock, Eye, AlertTriangle, CheckCircle, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { executionService } from "@/lib/execution-service"
import { agentService } from "@/lib/agent-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function HistoryPage() {
  const router = useRouter()
  const [executions, setExecutions] = useState([])
  const [agents, setAgents] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredExecutions, setFilteredExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Charger les exécutions depuis l'API
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger toutes les exécutions
        const executionsData = await executionService.getAllExecutions();
        
        // Trier les exécutions de la plus récente à la plus ancienne
        const sortedExecutions = executionsData.sort((a, b) => {
          const dateA = new Date(a.startTime || 0);
          const dateB = new Date(b.startTime || 0);
          return dateB - dateA; // Tri décroissant (plus récent au plus ancien)
        });
        
        // Normaliser les statuts pour s'assurer qu'ils sont dans un format cohérent
        const normalizedExecutions = sortedExecutions.map(execution => ({
          ...execution,
          status: normalizeStatus(execution.status)
        }));
        
        setExecutions(normalizedExecutions);
        setFilteredExecutions(normalizedExecutions);
        
        // Charger tous les agents pour pouvoir afficher leurs noms
        const agentsData = await agentService.getAllAgents();
        setAgents(agentsData);
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Erreur lors du chargement des données");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredExecutions(executions)
    } else {
      const filtered = executions.filter((execution) => {
        // Trouver l'agent correspondant pour obtenir son nom
        const agent = agents.find(a => a.id === execution.agentId);
        const agentName = agent ? agent.name : "Agent inconnu";
        
        return (
          agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          execution.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (execution.result && execution.result.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (execution.notes && execution.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
      
      setFilteredExecutions(filtered);
    }
  }, [searchTerm, executions, agents])

  // Fonction pour normaliser les statuts d'exécution
  const normalizeStatus = (status) => {
    if (!status) return "EN_COURS";
    
    // Convertir en majuscules et supprimer les espaces
    const normalizedStatus = status.toUpperCase().trim();
    
    // Mapper les différentes variantes possibles
    if (normalizedStatus.includes("TERMIN")) return "TERMINÉ";
    if (normalizedStatus.includes("ECHEC") || normalizedStatus.includes("ÉCHOU") || normalizedStatus.includes("ECHOU")) return "ÉCHOUÉ";
    if (normalizedStatus.includes("COURS") || normalizedStatus.includes("RUNNING") || normalizedStatus === "RUN") return "EN_COURS";
    
    // Par défaut, retourner le statut tel quel
    return status;
  };

  const handleViewExecution = (executionId) => {
    router.push(`/dashboard/execute-agent?executionId=${executionId}`)
  }

  const filterByStatus = (status) => {
    if (status === "all") {
      setFilteredExecutions(executions)
    } else {
      const filtered = executions.filter(
        (execution) => execution.status === status
      )
      setFilteredExecutions(filtered)
    }
  }

  // Fonction pour obtenir le nom de l'agent à partir de son ID
  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : "Agent inconnu";
  }

  return (
    <div className="space-y-4 w-full">
      <Card className="w-full border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Historique d'exécution</CardTitle>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par nom d'agent, statut ou résultat..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full mt-4">
            <TabsList className="w-full flex bg-muted/50">
              <TabsTrigger value="all" className="flex-1" onClick={() => filterByStatus("all")}>
                Tous
              </TabsTrigger>
              <TabsTrigger value="TERMINÉ" className="flex-1" onClick={() => filterByStatus("TERMINÉ")}>
                Terminés
              </TabsTrigger>
              <TabsTrigger value="EN_COURS" className="flex-1" onClick={() => filterByStatus("EN_COURS")}>
                En cours
              </TabsTrigger>
              <TabsTrigger value="ÉCHOUÉ" className="flex-1" onClick={() => filterByStatus("ÉCHOUÉ")}>
                Échoués
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Chargement de l'historique...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <HistoryList 
                  executions={filteredExecutions} 
                  onViewExecution={handleViewExecution} 
                  getAgentName={getAgentName} 
                />
              )}
            </TabsContent>
            <TabsContent value="TERMINÉ" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Chargement de l'historique...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <HistoryList 
                  executions={filteredExecutions} 
                  onViewExecution={handleViewExecution} 
                  getAgentName={getAgentName} 
                />
              )}
            </TabsContent>
            <TabsContent value="EN_COURS" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Chargement de l'historique...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <HistoryList 
                  executions={filteredExecutions} 
                  onViewExecution={handleViewExecution} 
                  getAgentName={getAgentName} 
                />
              )}
            </TabsContent>
            <TabsContent value="ÉCHOUÉ" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Chargement de l'historique...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  <p>{error}</p>
                </div>
              ) : (
                <HistoryList 
                  executions={filteredExecutions} 
                  onViewExecution={handleViewExecution} 
                  getAgentName={getAgentName} 
                />
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
}

function HistoryList({ executions, onViewExecution, getAgentName }) {
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  if (executions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-medium">Aucune exécution trouvée</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Aucune exécution ne correspond à vos critères de recherche.
        </p>
      </div>
    )
  }

  // Fonction utilitaire pour formater les dates de manière sécurisée
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Date non disponible";
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) return "Date invalide";
      return format(date, "dd/MM/yyyy à HH:mm");
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return "Date invalide";
    }
  };
  
  // Fonction pour analyser les résultats et déterminer s'il y a fraude
  const analyzeResults = (resultData) => {
    try {
      console.log("Analyse des résultats:", resultData);
      
      if (!resultData) return { hasFraud: false, message: "Aucun résultat disponible" };
      
      // Si les résultats sont déjà un tableau ou un objet, les utiliser directement
      // Sinon, essayer de parser le JSON si c'est une chaîne
      let parsedData = resultData;
      if (typeof resultData === 'string') {
        try {
          parsedData = JSON.parse(resultData);
        } catch (e) {
          console.log("Résultat n'est pas du JSON valide:", e);
        }
      }
      
      console.log("Données analysées:", parsedData);
      
      // Vérifier directement si les résultats indiquent une fraude
      // Format spécifique de l'app.py: tableau d'objets avec propriété 'fraude'
      if (Array.isArray(parsedData)) {
        // Vérifier si au moins une facture est marquée comme frauduleuse
        const fraudDetected = parsedData.some(item => {
          if (!item) return false;
          
          // Vérifier la propriété 'fraude' qui peut contenir 'Oui' ou 'Non'
          if (item.fraude && (item.fraude === 'Oui' || item.fraude === true || 
              (typeof item.fraude === 'string' && item.fraude.toLowerCase().includes('oui')))) {
            return true;
          }
          
          // Vérifier d'autres propriétés qui pourraient indiquer une fraude
          return item.frauduleuse === true || 
                 item.status === 'frauduleuse' ||
                 (typeof item === 'string' && item.toLowerCase().includes('fraude'));
        });
        
        if (fraudDetected) {
          // Compter le nombre de factures frauduleuses
          const fraudCount = parsedData.filter(item => 
            item && (item.fraude === 'Oui' || item.fraude === true || 
            (typeof item.fraude === 'string' && item.fraude.toLowerCase().includes('oui')))
          ).length;
          
          return { 
            hasFraud: true, 
            message: `OUI - ${fraudCount} fraude(s) détectée(s)`, 
            details: parsedData 
          };
        }
        
        return { 
          hasFraud: false, 
          message: "NON - Aucune fraude détectée", 
          details: parsedData 
        };
      }
      
      // Si ce n'est pas un tableau, vérifier dans l'objet ou la chaîne
      const resultStr = JSON.stringify(parsedData).toLowerCase();
      if (resultStr.includes('fraude') || resultStr.includes('oui') || 
          resultStr.includes('suspicious') || resultStr.includes('anomalie') || 
          resultStr.includes('irrégularité')) {
        return { 
          hasFraud: true, 
          message: "OUI - Fraude détectée", 
          details: parsedData 
        };
      }
      
      return { 
        hasFraud: false, 
        message: "NON - Aucune fraude détectée", 
        details: parsedData 
      };
    } catch (error) {
      console.error("Erreur lors de l'analyse des résultats:", error);
      return { hasFraud: false, message: "Erreur lors de l'analyse des résultats" };
    }
  };
  
  // Fonction pour afficher les détails d'une exécution
  const showExecutionDetails = (execution) => {
    setSelectedExecution(execution);
    setShowDetailsDialog(true);
  };

  return (
    <>
      <div className="space-y-6">
        {executions.map((execution) => {
          const resultAnalysis = analyzeResults(execution.result);
          
          return (
            <Card key={execution.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{getAgentName(execution.agentId)}</CardTitle>
                  </div>
                  <Badge 
                    variant={
                      execution.status === "TERMINÉ" 
                        ? "success" 
                        : execution.status === "ÉCHOUÉ" 
                          ? "destructive" 
                          : "default"
                    }
                    className="ml-2"
                  >
                    {execution.status === "EN_COURS" ? "En cours" :
                     execution.status === "TERMINÉ" ? "Terminé" :
                     execution.status === "ÉCHOUÉ" ? "Échoué" :
                     execution.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Démarré le {formatDate(execution.startTime)}
                  </span>
                  {execution.endTime && (
                    <span className="flex items-center gap-1 ml-4">
                      <Clock className="h-4 w-4" />
                      Terminé le {formatDate(execution.endTime)}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mt-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Résultat de l'analyse</h4>
                    <div className={`p-4 rounded-md text-sm flex items-center gap-3 ${resultAnalysis.hasFraud ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {resultAnalysis.hasFraud ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <span className="font-medium">{resultAnalysis.message}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-muted">
                      ID: {execution.id ? execution.id.substring(0, 8) + "..." : "ID non disponible"}
                    </Badge>
                    {execution.status === "TERMINÉ" && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Succès
                      </Badge>
                    )}
                    {execution.status === "ÉCHOUÉ" && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Échec
                      </Badge>
                    )}
                    {execution.status === "EN_COURS" && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        En cours
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={() => showExecutionDetails(execution)}
                    size="sm"
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Voir les détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Dialog pour afficher les détails de l'exécution */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {selectedExecution && getAgentName(selectedExecution.agentId)}
            </DialogTitle>
            <DialogDescription>
              {selectedExecution && (
                <span className="text-sm text-muted-foreground">
                  ID: {selectedExecution.id}
                </span>
              )}
            </DialogDescription>
            {selectedExecution && (
              <div className="mt-2">
                <Badge 
                  variant={
                    selectedExecution.status === "TERMINÉ" 
                      ? "success" 
                      : selectedExecution.status === "ÉCHOUÉ" 
                        ? "destructive" 
                        : "default"
                  }
                >
                  {selectedExecution.status === "EN_COURS" ? "En cours" :
                   selectedExecution.status === "TERMINÉ" ? "Terminé" :
                   selectedExecution.status === "ÉCHOUÉ" ? "Échoué" :
                   selectedExecution.status}
                </Badge>
              </div>
            )}
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Date de début</h3>
                  <p className="text-sm">{formatDate(selectedExecution.startTime)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Date de fin</h3>
                  <p className="text-sm">{formatDate(selectedExecution.endTime)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Résultats détaillés</h3>
                {(() => {
                  try {
                    if (!selectedExecution.result) return (
                      <div className="bg-muted p-4 rounded-md text-center">
                        <p className="text-sm text-muted-foreground">Aucun résultat disponible</p>
                      </div>
                    );
                    
                    // Analyser les résultats
                    let resultData;
                    if (typeof selectedExecution.result === 'object') {
                      resultData = selectedExecution.result;
                    } else {
                      try {
                        resultData = JSON.parse(selectedExecution.result);
                      } catch (e) {
                        return (
                          <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                            {selectedExecution.result}
                          </pre>
                        );
                      }
                    }
                    
                    // Si c'est un tableau, afficher un tableau structuré
                    if (Array.isArray(resultData)) {
                      return (
                        <div className="bg-muted p-4 rounded-md overflow-x-auto">
                          <h4 className="text-sm font-medium mb-3">Résultats de l'analyse des factures</h4>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100 text-left">
                                <th className="p-2 border text-xs font-medium">Facture</th>
                                <th className="p-2 border text-xs font-medium">Fraude détectée</th>
                                <th className="p-2 border text-xs font-medium">Confiance</th>
                                <th className="p-2 border text-xs font-medium">Détails</th>
                              </tr>
                            </thead>
                            <tbody>
                              {resultData.map((item, index) => {
                                const isFraud = item?.fraude === 'Oui' || item?.fraude === true;
                                return (
                                  <tr key={index} className={isFraud ? 'bg-red-50' : 'bg-green-50'}>
                                    <td className="p-2 border text-xs">{item?.numero || item?.id || `Facture ${index + 1}`}</td>
                                    <td className="p-2 border text-xs font-medium">
                                      <span className={`px-2 py-1 rounded-full text-xs ${isFraud ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {isFraud ? 'OUI' : 'NON'}
                                      </span>
                                    </td>
                                    <td className="p-2 border text-xs">{item?.confiance || item?.confidence || 'N/A'}</td>
                                    <td className="p-2 border text-xs">
                                      {item?.raison || item?.details || item?.motif || 'Aucun détail disponible'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    
                    // Si c'est un objet, afficher une liste de propriétés
                    return (
                      <div className="bg-muted p-4 rounded-md">
                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(resultData).map(([key, value]) => (
                            <div key={key} className="border-b pb-2">
                              <h5 className="text-xs font-medium mb-1">{key}</h5>
                              <div className="text-xs">
                                {typeof value === 'object' 
                                  ? <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
                                  : <span>{String(value)}</span>
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } catch (e) {
                    console.error("Erreur lors de l'affichage des résultats:", e);
                    return (
                      <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                        {selectedExecution.result || "Aucun résultat disponible"}
                      </pre>
                    );
                  }
                })()}
              </div>
              
              {selectedExecution.fichiers && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Fichiers analysés</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm">Nombre de factures: {selectedExecution.fichiers.nb_factures || "Non spécifié"}</p>
                    <p className="text-sm">Ordre de mission: {selectedExecution.fichiers.ordre_mission || "Non spécifié"}</p>
                  </div>
                </div>
              )}
              
              {selectedExecution.error && (
                <div>
                  <h3 className="text-sm font-medium mb-2 text-red-600">Erreur</h3>
                  <div className="bg-red-50 p-4 rounded-md text-sm text-red-700">
                    {selectedExecution.error}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)} className="mt-4">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
