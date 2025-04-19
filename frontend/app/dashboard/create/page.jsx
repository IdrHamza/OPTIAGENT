"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Bot } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateAgent() {
  const router = useRouter()
  const [agentName, setAgentName] = useState("")
  const [agentRole, setAgentRole] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateAgent = () => {
    // Validation
    if (!agentName.trim()) {
      setError("Le nom de l'agent est requis")
      return
    }

    if (!agentRole.trim()) {
      setError("La description du rôle est requise")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Créer un nouvel agent
      const newAgent = {
        id: Date.now().toString(),
        name: agentName.trim(),
        role: agentRole.trim(),
        createdAt: new Date().toISOString()
      }

      // Récupérer la liste actuelle des agents
      const currentAgents = JSON.parse(localStorage.getItem("agents") || "[]")
      
      // Ajouter le nouvel agent
      const updatedAgents = [newAgent, ...currentAgents]
      
      // Sauvegarder dans localStorage
      localStorage.setItem("agents", JSON.stringify(updatedAgents))
      
      // Rediriger vers la page d'exécution de l'agent
      router.push(`/dashboard/execute?agentId=${newAgent.id}`)
    } catch (error) {
      console.error("Error creating agent:", error)
      setError("Une erreur s'est produite lors de la création de l'agent")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Créer un nouvel agent</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Détails de l'agent</CardTitle>
          <CardDescription>Configurez les informations de base de votre nouvel agent d'automatisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Nom de l'agent</Label>
            <Input
              id="agent-name"
              placeholder="ex: Agent de vérification de factures"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agent-role">Rôle de l'agent</Label>
            <Textarea
              id="agent-role"
              placeholder="ex: Vérifier la conformité des factures avec les ordres du jour"
              className="min-h-[120px]"
              value={agentRole}
              onChange={(e) => setAgentRole(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreateAgent} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Création en cours...</>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Créer l'agent
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 