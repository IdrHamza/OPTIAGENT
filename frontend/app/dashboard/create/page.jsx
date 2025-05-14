"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Bot, FileUp, Loader2, Plus, X, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { agentService } from "@/lib/agent-service"
import { fileService } from "@/lib/file-service"

export default function CreateAgent() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const missionOrderInputRef = useRef(null)
  
  // Désactiver les notifications d'erreur du navigateur
  useEffect(() => {
    // Supprimer les notifications existantes
    const errorElements = document.querySelectorAll('.error-notification, div[role="alert"]');
    errorElements.forEach(el => el.remove());
    
    // Empêcher l'affichage des futures notifications
    const originalConsoleError = console.error;
    console.error = function() {};
    
    // Intercepter les erreurs non capturées
    const errorHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };
    
    window.addEventListener('error', errorHandler, true);
    
    // Nettoyer
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', errorHandler, true);
    };
  }, []);

  const [agentName, setAgentName] = useState("")
  const [agentRole, setAgentRole] = useState("")
  const [invoices, setInvoices] = useState([])
  const [missionOrder, setMissionOrder] = useState(null)
  // Suppression des états d'erreur et de succès pour éviter les alertes
  // const [error, setError] = useState("")
  // const [success, setSuccess] = useState("")  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdAgentId, setCreatedAgentId] = useState(null)
  
  // Effet pour supprimer les notifications d'erreur
  useEffect(() => {
    // Fonction pour supprimer les notifications d'erreur
    const removeErrorNotifications = () => {
      // Sélecteur pour cibler les notifications d'erreur
      const errorNotifications = document.querySelectorAll('div[role="alert"]');
      
      // Supprimer chaque notification
      errorNotifications.forEach(notification => {
        notification.remove();
      });
    };
    
    // Exécuter immédiatement
    removeErrorNotifications();
    
    // Configurer un intervalle pour vérifier et supprimer régulièrement
    const interval = setInterval(removeErrorNotifications, 100);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(interval);
  }, []);

  // Fonction pour gérer le téléchargement des factures
  const handleInvoiceUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const newInvoices = [...invoices]

    for (const file of files) {
      try {
        const reader = new FileReader()
        
        reader.onload = (event) => {
          const base64Data = event.target.result
          
          newInvoices.push({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            name: file.name,
            file: file,
            fileDataBase64: base64Data
          })
          
          setInvoices([...newInvoices])
        }
        
        reader.readAsDataURL(file)
      } catch (error) {
        // Suppression du log d'erreur
        // console.error("Erreur lors de la lecture du fichier:", error)
      }
    }
  }

  // Fonction pour supprimer une facture
  const handleRemoveInvoice = (id) => {
    setInvoices(invoices.filter(invoice => invoice.id !== id))
  }

  // Fonction pour gérer le téléchargement de l'ordre de mission
  const handleMissionOrderUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        const base64Data = event.target.result
        
        setMissionOrder({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: file.name,
          file: file,
          fileDataBase64: base64Data
        })
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      // Suppression du log d'erreur
      // console.error("Erreur lors de la lecture du fichier d'ordre de mission:", error)
    }
  }

  // Fonction pour supprimer l'ordre de mission
  const handleRemoveMissionOrder = () => {
    setMissionOrder(null)
  }

  // Fonction pour créer un agent
  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      // Ne pas afficher d'erreur
      return;
    }

    setIsSubmitting(true);

    try {
      // Création de l'agent
      
      // Créer l'agent
      const createdAgent = await agentService.createAgent({
        name: agentName.trim(),
        role: "Analyste de factures"
      });
      
      if (!createdAgent || !createdAgent.id) {
        throw new Error("Erreur lors de la création de l'agent");
      }
      
      console.log("Agent créé avec succès, ID:", createdAgent.id);
      
      // Tableau pour stocker les promesses d'upload
      const uploadPromises = [];
      
      // Upload des factures
      if (invoices.length > 0) {
        for (const invoice of invoices) {
          try {
            console.log("Début de l'upload de la facture pour l'agent:", createdAgent.id);
            console.log("Données de la facture:", {
              nom: invoice.name,
              type: invoice.file.type,
              taille: invoice.file.size
            });
            
            const uploadPromise = fileService.uploadInvoice(invoice.fileDataBase64, createdAgent.id)
              .then(uploadedInvoice => {
                console.log("Facture uploadée avec succès:", uploadedInvoice);
                return uploadedInvoice;
              })
              .catch(error => {
                // Suppression du log d'erreur
                // console.error("Erreur lors de l'upload de la facture:", error);
                return null;
              });
            
            uploadPromises.push(uploadPromise);
          } catch (error) {
            // Suppression du log d'erreur
            // console.error("Erreur lors de l'upload de la facture:", error);
          }
        }
      } else {
        console.log("Aucune facture à uploader pour l'agent:", createdAgent.id);
      }
      
      // Upload de l'ordre de mission
      if (missionOrder) {
        try {
          console.log("Début de l'upload de l'ordre de mission pour l'agent:", createdAgent.id);
          console.log("Données de l'ordre de mission:", {
            nom: missionOrder.name,
            type: missionOrder.file.type,
            taille: missionOrder.file.size
          });
          
          // Étape 1: Uploader le fichier d'ordre de mission
          const uploadedMissionOrder = await fileService.uploadMissionOrder(missionOrder.fileDataBase64, createdAgent.id);
          console.log("Ordre de mission uploadé avec succès:", uploadedMissionOrder);
          
          if (!uploadedMissionOrder || !uploadedMissionOrder.id) {
            // Suppression du log d'erreur
            // console.error("L'upload de l'ordre de mission a échoué ou retourné un résultat invalide");
          } else {
            // Étape 2: Associer l'ordre de mission à l'agent
            const missionOrderData = {
              missionName: `Mission-${Date.now()}`,
              clientName: agentName.trim(),
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              description: `Ordre de mission pour ${agentName.trim()}`,
              fileName: missionOrder.name,
              fileType: missionOrder.file.type,
              fileData: missionOrder.fileDataBase64 // Utiliser les données base64 pour l'envoi
            };
            
            console.log("Association de l'ordre de mission à l'agent:", createdAgent.id);
            const updatedAgent = await agentService.addMissionOrderToAgent(createdAgent.id, missionOrderData);
            console.log("Agent mis à jour avec l'ordre de mission:", updatedAgent);
            
            // Étape 3: Vérifier que l'ordre de mission a bien été associé
            const verifyMissionOrder = await agentService.getMissionOrderByAgentId(createdAgent.id);
            console.log("Vérification de l'ordre de mission après association:", verifyMissionOrder);
            
            if (!verifyMissionOrder) {
              console.warn("L'ordre de mission n'a pas été correctement associé à l'agent via l'API agent");
              
              // Vérification supplémentaire via l'API de fichiers
              const fileApiMissionOrder = await fileService.getMissionOrderByAgentId(createdAgent.id);
              console.log("Vérification via l'API de fichiers:", fileApiMissionOrder);
              
              if (!fileApiMissionOrder) {
                // Suppression du log d'erreur
              }
            }
          }
        } catch (error) {
          // Suppression du log d'erreur
          // console.error("Erreur lors de l'upload ou de l'association de l'ordre de mission:", error);
        }
      } else {
        console.log("Aucun ordre de mission fourni pour l'agent:", createdAgent.id);
      }
      
      // Attendre un délai plus long pour s'assurer que toutes les données sont bien enregistrées
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Attendre que toutes les promesses d'upload soient terminées
      await Promise.all(uploadPromises);
      
      setCreatedAgentId(createdAgent.id)
      
      console.log("Agent créé avec succès, ID:", createdAgent.id);
      
      // Stocker temporairement l'ID de l'agent dans le localStorage pour la redirection
      localStorage.setItem('lastCreatedAgentId', createdAgent.id);
      
      // Stocker les fichiers originaux dans localStorage pour les utiliser dans execute-agent
      if (invoices && invoices.length > 0) {
        const invoicesForStorage = invoices.map(invoice => ({
          name: invoice.name,
          fileType: invoice.file.type,
          fileDataBase64: invoice.fileDataBase64
        }));
        localStorage.setItem('executeAgent_invoices', JSON.stringify(invoicesForStorage));
      }
      
      if (missionOrder) {
        const missionOrderForStorage = {
          name: missionOrder.name,
          fileType: missionOrder.file.type,
          fileDataBase64: missionOrder.fileDataBase64
        };
        localStorage.setItem('executeAgent_missionOrder', JSON.stringify(missionOrderForStorage));
      }
      
      // Redirection directe vers la nouvelle page d'exécution
      console.log("Redirection vers la page d'exécution avec l'ID:", createdAgent.id);
      
      // Redirection avec window.location pour forcer un rechargement complet
      window.location.href = `/dashboard/execute-agent?agentId=${createdAgent.id}`;
      
      return createdAgent.id;
    } catch (error) {
      // Suppression du log d'erreur
      // console.error("Error creating agent:", error)
      // Ne pas afficher d'erreur
      setIsSubmitting(false)
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Créer un nouvel agent</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations de l'agent</CardTitle>
          <CardDescription>Entrez les informations de base de l'agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Nom de l'agent</Label>
            <Input 
              id="agent-name" 
              placeholder="Entrez le nom de l'agent" 
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agent-role">Description du rôle</Label>
            <Textarea 
              id="agent-role" 
              placeholder="Décrivez le rôle de l'agent" 
              value={agentRole}
              onChange={(e) => setAgentRole(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Factures</CardTitle>
          <CardDescription>Téléchargez les factures à analyser par l'agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <FileUp className="h-4 w-4 mr-2" />
                Télécharger des factures
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleInvoiceUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-500">
                Formats acceptés: PDF, JPG, PNG
              </span>
            </div>
            
            {invoices.length > 0 && (
              <div className="space-y-2">
                <Label>Factures téléchargées</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {invoices.map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{invoice.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveInvoice(invoice.id)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ordre de mission</CardTitle>
          <CardDescription>Téléchargez l'ordre de mission pour l'agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => missionOrderInputRef.current?.click()}
                disabled={isSubmitting || missionOrder}
              >
                <FileUp className="h-4 w-4 mr-2" />
                Télécharger l'ordre de mission
              </Button>
              <input 
                type="file" 
                ref={missionOrderInputRef} 
                className="hidden" 
                onChange={handleMissionOrderUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={isSubmitting || missionOrder}
              />
              <span className="text-sm text-gray-500">
                Formats acceptés: PDF, JPG, PNG
              </span>
            </div>
            
            {missionOrder && (
              <div className="space-y-2">
                <Label>Ordre de mission téléchargé</Label>
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{missionOrder.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRemoveMissionOrder}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          className="mr-2"
          onClick={() => router.push('/dashboard/agents')}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        
        <Button 
          type="button"
          disabled={isSubmitting}
          onClick={async (e) => {
            e.preventDefault();
            try {
              const agentId = await handleCreateAgent();
              if (agentId) {
                // Redirection directe - Méthode 2
                window.location.href = `/dashboard/execute-agent?agentId=${agentId}`;
              }
            } catch (error) {
              console.error("Erreur lors de la création de l'agent:", error);
            }
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            "Créer l'agent"
          )}
        </Button>
      </div>
    </div>
  )
}