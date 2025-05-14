"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, FileCheck, AlertTriangle, Plus, BarChart3, Clock, User, FileText } from "lucide-react"
import Link from "next/link"
import { agentService } from "@/lib/agent-service"
import { executionService } from "@/lib/execution-service"
import { userService } from "@/lib/user-service"

export default function Dashboard() {
  const [agents, setAgents] = useState([])
  const [recentExecutions, setRecentExecutions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [userStats, setUserStats] = useState({
    totalAgents: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      // Récupérer l'ID de l'utilisateur actuel
      const userStr = localStorage.getItem('opti_agent_user')
      let currentUserId = null
      
      try {
        if (userStr) {
          const user = JSON.parse(userStr)
          currentUserId = user.id
        }
      } catch (e) {
        console.error("Erreur lors du parsing de l'utilisateur:", e)
      }
      
      if (!currentUserId) {
        setError("Utilisateur non connecté")
        setIsLoading(false)
        return
      }
      
      // Pour les agents, utiliser uniquement l'API
      try {
        const userAgents = await agentService.getAgentsByUserId(currentUserId)
        setAgents(userAgents)
      } catch (error) {
        console.error("Erreur lors du chargement des agents:", error)
        setError(prev => prev ? `${prev}, Erreur agents` : "Erreur lors du chargement des agents")
        setAgents([]) // Initialiser avec un tableau vide en cas d'erreur
      }
      
      // Récupérer les exécutions depuis MongoDB via l'API FastAPI
      try {
        // Récupérer toutes les exécutions depuis MongoDB
        const allExecutions = await executionService.getAllExecutions()
        console.log("Exécutions récupérées depuis MongoDB:", allExecutions)
        
        // Calculer les statistiques à partir des données récupérées
        const totalExecutions = allExecutions.length
        const successfulExecutions = allExecutions.filter(exec => exec.status === "TERMINÉ").length
        const failedExecutions = allExecutions.filter(exec => exec.status === "ÉCHOUÉ").length
        
        // Mettre à jour les statistiques utilisateur
        setUserStats({
          totalAgents: agents.length,
          totalExecutions,
          successfulExecutions,
          failedExecutions
        })
        
        // Prendre les 5 exécutions les plus récentes pour l'affichage
        setRecentExecutions(allExecutions.slice(0, 5))
      } catch (error) {
        console.error("Erreur lors du chargement des exécutions depuis MongoDB:", error)
        setError(prev => prev ? `${prev}, Erreur exécutions` : "Erreur lors du chargement des exécutions")
        
        // Fallback sur localStorage si MongoDB n'est pas disponible
        try {
          const savedExecutions = localStorage.getItem("executions")
          let executionsList = []
          
          if (savedExecutions) {
            executionsList = JSON.parse(savedExecutions)
            
            // Filtrer pour n'obtenir que les exécutions de l'utilisateur actuel
            executionsList = executionsList.filter(exec => exec.userId === currentUserId)
            
            // Trier par date (la plus récente en premier)
            executionsList.sort((a, b) => {
              const dateA = a.startTime ? new Date(a.startTime) : new Date(0)
              const dateB = b.startTime ? new Date(b.startTime) : new Date(0)
              return dateB - dateA
            })
          }
          
          setRecentExecutions(executionsList.slice(0, 5))
          
          // Calculer les statistiques à partir du localStorage
          const totalExecutions = executionsList.length
          const successfulExecutions = executionsList.filter(exec => exec.status === "SUCCESS").length
          const failedExecutions = executionsList.filter(exec => exec.status === "FAILED").length
          
          setUserStats({
            totalAgents: agents.length,
            totalExecutions,
            successfulExecutions,
            failedExecutions
          })
        } catch (localError) {
          console.error("Erreur lors du fallback sur localStorage:", localError)
          setRecentExecutions([]) // Initialiser avec un tableau vide en cas d'erreur
          setUserStats({
            totalAgents: agents.length,
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0
          })
        }
      }
      
      setIsLoading(false)
    }
    
    fetchData()
  }, [])

  // Calculer les statistiques pour les cartes
  const successfulCount = recentExecutions.filter((exec) => exec.status === "SUCCESS").length
  const failedCount = recentExecutions.filter((exec) => exec.status === "FAILED").length
  const pendingCount = recentExecutions.filter((exec) => exec.status === "PENDING").length
  const totalInvoices = invoices.length
  const totalInvoiceAmount = invoices.reduce((total, invoice) => total + (invoice.amount || 0), 0)

  return (
    <div className="w-full space-y-6">
      <Card className="w-full border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Tableau de bord</CardTitle>
              <CardDescription>Bienvenue sur votre tableau de bord OptiAgent</CardDescription>
            </div>
            <Button asChild className="gap-2">
              <Link href="/dashboard/create">
                <Plus className="h-4 w-4" />
                Créer un nouvel agent
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Agents</CardTitle>
                    <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{userStats.totalAgents || agents.length}</div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {agents.length === 0 ? "Aucun agent créé" : "Agents prêts à l'exécution"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Exécutions réussies</CardTitle>
                    <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">{userStats.successfulExecutions || successfulCount}</div>
                    <p className="text-xs text-green-600 dark:text-green-400">Exécutions terminées avec succès</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Exécutions échouées</CardTitle>
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-700 dark:text-red-300">{userStats.failedExecutions || failedCount}</div>
                    <p className="text-xs text-red-600 dark:text-red-400">Exécutions terminées en échec</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total exécutions</CardTitle>
                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{userStats.totalExecutions || recentExecutions.length}</div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Nombre total d'exécutions</p>
                  </CardContent>
                </Card>
              </div>

              {/* Section des exécutions récentes directement après les statistiques */}

              {/* Section des exécutions récentes */}
              <h2 className="text-xl font-semibold mb-4">Exécutions récentes</h2>
              <div className="grid gap-4">
                {recentExecutions.length > 0 ? (
                  recentExecutions.map((execution) => {
                    // Analyser les résultats pour détecter les fraudes
                    let fraudeDetectee = false;
                    let messageResultat = "Aucun résultat disponible";
                    
                    if (execution.result) {
                      try {
                        // Essayer de parser les résultats
                        let resultData = execution.result;
                        if (typeof resultData === 'string') {
                          resultData = JSON.parse(resultData);
                        }
                        
                        // Vérifier si c'est un tableau de factures
                        if (Array.isArray(resultData)) {
                          // Vérifier si au moins une facture est marquée comme frauduleuse
                          const fraudCount = resultData.filter(item => 
                            item && (item.fraude === 'Oui' || item.fraude === true || 
                            (typeof item.fraude === 'string' && item.fraude.toLowerCase().includes('oui')))
                          ).length;
                          
                          if (fraudCount > 0) {
                            fraudeDetectee = true;
                            messageResultat = `${fraudCount} fraude(s) détectée(s)`;
                          } else {
                            messageResultat = "Aucune fraude détectée";
                          }
                        } else if (typeof resultData === 'object') {
                          // Vérifier dans l'objet
                          const resultStr = JSON.stringify(resultData).toLowerCase();
                          if (resultStr.includes('fraude') || resultStr.includes('oui')) {
                            fraudeDetectee = true;
                            messageResultat = "Fraude détectée";
                          } else {
                            messageResultat = "Aucune fraude détectée";
                          }
                        }
                      } catch (e) {
                        console.error("Erreur lors de l'analyse des résultats:", e);
                      }
                    }
                    
                    return (
                      <Card key={execution.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-4 p-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-500">
                                {new Date(execution.startTime).toLocaleString()}
                              </span>
                            </div>
                            <h3 className="font-medium">
                              Agent: {agents.find(a => a.id === execution.agentId)?.name || "Agent inconnu"}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  execution.status === "TERMINÉ"
                                    ? "bg-green-100 text-green-800"
                                    : execution.status === "ÉCHOUÉ"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {execution.status === "TERMINÉ" ? "Terminé" :
                                 execution.status === "ÉCHOUÉ" ? "Échoué" :
                                 execution.status === "EN_COURS" ? "En cours" :
                                 execution.status}
                              </span>
                              
                              {execution.status === "TERMINÉ" && (
                                <span
                                  className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    fraudeDetectee 
                                      ? "bg-red-100 text-red-800" 
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {fraudeDetectee ? "OUI" : "NON"}
                                </span>
                              )}
                            </div>
                            
                            {execution.status === "TERMINÉ" && (
                              <p className="mt-2 text-sm text-gray-600">
                                Résultat: <span className={fraudeDetectee ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                                  {messageResultat}
                                </span>
                              </p>
                            )}
                            
                            {execution.error && (
                              <p className="mt-2 text-sm text-red-600">
                                Erreur: {execution.error}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/dashboard/history?id=${execution.id}`}>
                                Voir les détails
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="p-4 text-center text-gray-500">
                    Aucune exécution récente
                  </Card>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
