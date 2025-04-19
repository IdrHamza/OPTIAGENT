"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle, FileUp, Loader2, Plus, X, FileText, Eye, Edit, Trash2, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

export default function ExecuteAgent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentId = searchParams.get("agentId")
  const fileInputRef = useRef(null)

  const [agent, setAgent] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [missionOrders, setMissionOrders] = useState([])
  const [error, setError] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [executionStage, setExecutionStage] = useState("")
  const [currentStep, setCurrentStep] = useState("upload")
  const [agentExecutions, setAgentExecutions] = useState([])
  
  // États pour la gestion des documents
  const [viewDocumentDialog, setViewDocumentDialog] = useState(false)
  const [editDocumentDialog, setEditDocumentDialog] = useState(false)
  const [currentDocument, setCurrentDocument] = useState(null)
  const [documentContent, setDocumentContent] = useState("")
  const [documentName, setDocumentName] = useState("")
  const [documentType, setDocumentType] = useState("")
  const [currentExecutionId, setCurrentExecutionId] = useState(null)

  useEffect(() => {
    if (!agentId) {
      router.push("/dashboard")
      return
    }

    // Load agent from localStorage
    const agents = JSON.parse(localStorage.getItem("agents") || "[]")
    const foundAgent = agents.find((a) => a.id === agentId)

    if (!foundAgent) {
      router.push("/dashboard")
      return
    }

    setAgent(foundAgent)
    
    // Charger les exécutions précédentes de cet agent
    const executions = JSON.parse(localStorage.getItem("executions") || "[]")
    const filteredExecutions = executions.filter(exec => exec.agentId === agentId)
    setAgentExecutions(filteredExecutions)
  }, [agentId, router])

  const handleInvoiceChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
      }))

      setInvoices((prev) => [...prev, ...newFiles])
    }
  }

  const handleMissionOrderChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
      }))

      setMissionOrders((prev) => [...prev, ...newFiles])
    }
  }

  const removeInvoice = (id) => {
    setInvoices(invoices.filter((doc) => doc.id !== id))
  }

  const removeMissionOrder = (id) => {
    setMissionOrders(missionOrders.filter((doc) => doc.id !== id))
  }

  const handleStart = () => {
    if (invoices.length === 0) {
      setError("Veuillez télécharger au moins une facture")
      return
    }

    if (missionOrders.length === 0) {
      setError("Veuillez télécharger au moins un ordre du jour")
      return
    }

    setError("")
    setCurrentStep("execute")
  }

  const simulateExecution = () => {
    setIsExecuting(true)
    setExecutionProgress(0)
    setExecutionStage("Initialisation de l'agent...")

    // Simulate execution stages
    const stages = [
      { progress: 10, message: "Chargement des documents..." },
      { progress: 30, message: "Analyse des factures..." },
      { progress: 50, message: "Analyse des ordres du jour..." },
      { progress: 70, message: "Vérification croisée des documents..." },
      { progress: 90, message: "Génération du rapport de vérification..." },
      { progress: 100, message: "Exécution terminée !" },
    ]

    let currentStage = 0

    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setExecutionProgress(stages[currentStage].progress)
        setExecutionStage(stages[currentStage].message)
        currentStage++
      } else {
        clearInterval(interval)

        // Randomly determine if documents are legitimate or fraudulent
        const isLegitimate = Math.random() > 0.5

        // Generate execution result
        const executionResult = {
          id: Date.now().toString(),
          agentId: agent.id,
          agentName: agent.name,
          timestamp: new Date().toISOString(),
          invoices: invoices.map((doc) => ({
            id: doc.id,
            name: doc.name,
            type: "invoice",
          })),
          missionOrders: missionOrders.map((doc) => ({
            id: doc.id,
            name: doc.name,
            type: "missionOrder",
          })),
          result: isLegitimate ? "Légitime" : "Frauduleux",
          reason: isLegitimate
            ? "Tous les détails des documents correspondent et semblent authentiques."
            : "Incohérence détectée entre le montant de la facture et l'autorisation de l'ordre du jour.",
        }

        // Save execution to localStorage
        const existingExecutions = JSON.parse(localStorage.getItem("executions") || "[]")
        localStorage.setItem("executions", JSON.stringify([executionResult, ...existingExecutions]))

        // Navigate to result page
        router.push(`/dashboard/result?executionId=${executionResult.id}`)
      }
    }, 800)
  }

  const handleExecute = () => {
    setError("")
    simulateExecution()
  }

  // Fonction pour afficher le document
  const handleViewDocument = (doc, type, executionId = null) => {
    setCurrentDocument(doc)
    setDocumentType(type)
    setCurrentExecutionId(executionId)
    
    // Simuler l'URL de l'image
    // Dans une application réelle, vous utiliseriez doc.file ou une URL de stockage
    // Pour la simulation, nous utilisons des images placeholder
    let imageUrl = "";
    
    if (type === "invoice") {
      // Simulation d'une facture
      imageUrl = "/placeholder.jpg"; // Utiliser une image de placeholder dans le dossier public
    } else {
      // Simulation d'un ordre de mission
      imageUrl = "/placeholder-user.jpg"; // Utiliser une autre image de placeholder
    }
    
    setDocumentContent(imageUrl)
    setViewDocumentDialog(true)
  }
  
  // Fonction pour ouvrir le dialogue d'édition
  const handleEditDocument = () => {
    setDocumentName(currentDocument.name)
    setViewDocumentDialog(false)
    setEditDocumentDialog(true)
  }
  
  // Fonction pour sauvegarder les modifications d'un document
  const handleSaveDocument = () => {
    if (!documentName.trim()) {
      return // Ne pas sauvegarder si le nom est vide
    }
    
    try {
      if (currentExecutionId) {
        // Mise à jour dans une exécution existante
        const executions = JSON.parse(localStorage.getItem("executions") || "[]")
        const updatedExecutions = executions.map(execution => {
          if (execution.id === currentExecutionId) {
            // Mettre à jour le document dans l'exécution
            if (documentType === "invoice") {
              const updatedInvoices = execution.invoices.map(doc => 
                doc.id === currentDocument.id ? { ...doc, name: documentName } : doc
              )
              return { ...execution, invoices: updatedInvoices }
            } else {
              const updatedOrders = execution.missionOrders.map(doc => 
                doc.id === currentDocument.id ? { ...doc, name: documentName } : doc
              )
              return { ...execution, missionOrders: updatedOrders }
            }
          }
          return execution
        })
        
        localStorage.setItem("executions", JSON.stringify(updatedExecutions))
        
        // Rafraîchir les exécutions affichées
        const filteredExecutions = updatedExecutions.filter(exec => exec.agentId === agentId)
        setAgentExecutions(filteredExecutions)
      } else {
        // Mise à jour d'un document en cours d'upload
        if (documentType === "invoice") {
          setInvoices(invoices.map(doc => 
            doc.id === currentDocument.id ? { ...doc, name: documentName } : doc
          ))
        } else {
          setMissionOrders(missionOrders.map(doc => 
            doc.id === currentDocument.id ? { ...doc, name: documentName } : doc
          ))
        }
      }
      
      setEditDocumentDialog(false)
    } catch (error) {
      console.error("Error updating document:", error)
    }
  }
  
  // Fonction pour supprimer un document
  const handleDeleteDocument = () => {
    try {
      if (currentExecutionId) {
        // Suppression dans une exécution existante
        const executions = JSON.parse(localStorage.getItem("executions") || "[]")
        const updatedExecutions = executions.map(execution => {
          if (execution.id === currentExecutionId) {
            // Supprimer le document de l'exécution
            if (documentType === "invoice") {
              const updatedInvoices = execution.invoices.filter(doc => doc.id !== currentDocument.id)
              return { ...execution, invoices: updatedInvoices }
            } else {
              const updatedOrders = execution.missionOrders.filter(doc => doc.id !== currentDocument.id)
              return { ...execution, missionOrders: updatedOrders }
            }
          }
          return execution
        })
        
        localStorage.setItem("executions", JSON.stringify(updatedExecutions))
        
        // Rafraîchir les exécutions affichées
        const filteredExecutions = updatedExecutions.filter(exec => exec.agentId === agentId)
        setAgentExecutions(filteredExecutions)
      } else {
        // Suppression d'un document en cours d'upload
        if (documentType === "invoice") {
          setInvoices(invoices.filter(doc => doc.id !== currentDocument.id))
        } else {
          setMissionOrders(missionOrders.filter(doc => doc.id !== currentDocument.id))
        }
      }
      
      setViewDocumentDialog(false)
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }
  
  // Fonction pour ajouter un document à une exécution existante
  const handleAddDocumentToExecution = (executionId, type) => {
    setCurrentExecutionId(executionId)
    setDocumentType(type)
    
    // Ouvrir le sélecteur de fichier
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  // Gérer l'ajout de document à une exécution existante
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFile = {
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        file: e.target.files[0],
        name: e.target.files[0].name,
      }
      
      try {
        const executions = JSON.parse(localStorage.getItem("executions") || "[]")
        const updatedExecutions = executions.map(execution => {
          if (execution.id === currentExecutionId) {
            if (documentType === "invoice") {
              const updatedInvoices = [...execution.invoices, {
                id: newFile.id,
                name: newFile.name,
                type: "invoice"
              }]
              return { ...execution, invoices: updatedInvoices }
            } else {
              const updatedOrders = [...execution.missionOrders, {
                id: newFile.id,
                name: newFile.name,
                type: "missionOrder"
              }]
              return { ...execution, missionOrders: updatedOrders }
            }
          }
          return execution
        })
        
        localStorage.setItem("executions", JSON.stringify(updatedExecutions))
        
        // Rafraîchir les exécutions affichées
        const filteredExecutions = updatedExecutions.filter(exec => exec.agentId === agentId)
        setAgentExecutions(filteredExecutions)
      } catch (error) {
        console.error("Error adding document:", error)
      }
    }
  }

  if (!agent) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6">Exécuter l'agent</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input file caché pour l'ajout de documents aux exécutions existantes */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />

      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>{agent.name}</CardTitle>
          <CardDescription>{agent.role}</CardDescription>
        </CardHeader>
      </Card>

      {/* Historique des exécutions de l'agent */}
      {agentExecutions.length > 0 && (
        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle>Historique des exécutions</CardTitle>
            <CardDescription>Exécutions précédentes de cet agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentExecutions.map((execution) => (
                <div key={execution.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">Exécuté le {new Date(execution.timestamp).toLocaleString()}</p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          execution.result === "Légitime"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                        }`}
                      >
                        {execution.result}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/dashboard/result?executionId=${execution.id}`)}
                    >
                      Voir détails
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Factures</h4>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => handleAddDocumentToExecution(execution.id, "invoice")}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Ajouter</span>
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {execution.invoices && execution.invoices.length > 0 ? (
                          execution.invoices.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-accent/50">
                              <div className="flex items-center">
                                <FileText className="h-3 w-3 mr-2 text-blue-500" />
                                <span className="truncate max-w-[150px]">{doc.name}</span>
                              </div>
                              <div className="flex items-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleViewDocument(doc, "invoice", execution.id)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucune facture</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Ordres du jour</h4>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => handleAddDocumentToExecution(execution.id, "missionOrder")}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Ajouter</span>
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {execution.missionOrders && execution.missionOrders.length > 0 ? (
                          execution.missionOrders.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-accent/50">
                              <div className="flex items-center">
                                <FileText className="h-3 w-3 mr-2 text-green-500" />
                                <span className="truncate max-w-[150px]">{doc.name}</span>
                              </div>
                              <div className="flex items-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleViewDocument(doc, "missionOrder", execution.id)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun ordre du jour</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isExecuting ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Exécution de l'agent</CardTitle>
            <CardDescription>Veuillez patienter pendant que l'agent analyse les documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={executionProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">{executionStage}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full">
          {currentStep === "upload" ? (
            <div>
              <CardHeader>
                <CardTitle>Télécharger des documents</CardTitle>
                <CardDescription>Téléchargez les factures et ordres du jour pour vérification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <Tabs defaultValue="invoices" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="invoices">Factures</TabsTrigger>
                    <TabsTrigger value="missionOrders">Ordres du jour</TabsTrigger>
                  </TabsList>

                  <TabsContent value="invoices" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Factures</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("invoice-upload").click()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter des factures
                      </Button>
                      <Input
                        id="invoice-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleInvoiceChange}
                        className="hidden"
                        multiple
                      />
                    </div>

                    {invoices.length === 0 ? (
                      <div className="border border-dashed rounded-lg p-10 text-center">
                        <FileUp className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-2">Aucune facture téléchargée</p>
                        <p className="text-xs text-muted-foreground">Téléchargez des factures pour analyse</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        <div className="grid gap-2">
                          {invoices.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="text-sm truncate max-w-[300px]">{doc.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleViewDocument(doc, "invoice")}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeInvoice(doc.id)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="missionOrders" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Ordres du jour</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("mission-order-upload").click()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter des ordres du jour
                      </Button>
                      <Input
                        id="mission-order-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleMissionOrderChange}
                        className="hidden"
                        multiple
                      />
                    </div>

                    {missionOrders.length === 0 ? (
                      <div className="border border-dashed rounded-lg p-10 text-center">
                        <FileUp className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-2">Aucun ordre du jour téléchargé</p>
                        <p className="text-xs text-muted-foreground">Téléchargez des ordres du jour pour analyse</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        <div className="grid gap-2">
                          {missionOrders.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-green-500" />
                                <span className="text-sm truncate max-w-[300px]">{doc.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleViewDocument(doc, "missionOrder")}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMissionOrder(doc.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleStart}
                  disabled={invoices.length === 0 || missionOrders.length === 0}
                >
                  Démarrer
                </Button>
              </CardFooter>
            </div>
          ) : (
            <div>
              <CardHeader>
                <CardTitle>Prêt à exécuter</CardTitle>
                <CardDescription>Vérifiez les documents et lancez l'analyse</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Factures ({invoices.length})</h3>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="grid gap-2">
                        {invoices.map((doc) => (
                          <div key={doc.id} className="flex items-center p-2 bg-muted/50 rounded">
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm truncate">{doc.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Ordres du jour ({missionOrders.length})</h3>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="grid gap-2">
                        {missionOrders.map((doc) => (
                          <div key={doc.id} className="flex items-center p-2 bg-muted/50 rounded">
                            <FileText className="h-4 w-4 mr-2 text-green-500" />
                            <span className="text-sm truncate">{doc.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep("upload")}>
                  Retour
                </Button>
                <Button type="button" onClick={handleExecute}>
                  Exécuter
                </Button>
              </CardFooter>
            </div>
          )}
        </Card>
      )}

      {/* Ajouter les dialogues pour visualiser, éditer et supprimer les documents */}
      <Dialog open={viewDocumentDialog} onOpenChange={setViewDocumentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentDocument?.name}</DialogTitle>
            <DialogDescription>
              {documentType === "invoice" ? "Facture" : "Ordre du jour"}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <div className="border rounded-lg p-2 flex justify-center items-center min-h-[300px] max-h-[500px] overflow-auto">
              <img 
                src={documentContent} 
                alt={currentDocument?.name || "Document"} 
                className="max-w-full max-h-[480px] object-contain"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. Le document sera définitivement supprimé.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteDocument}>Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setViewDocumentDialog(false)}>
                Fermer
              </Button>
              <Button onClick={handleEditDocument}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={editDocumentDialog} onOpenChange={setEditDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
            <DialogDescription>
              Modifier les informations du document
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc-name">Nom du document</Label>
                <Input
                  id="doc-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDocumentDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveDocument}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
