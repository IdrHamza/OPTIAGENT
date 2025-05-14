"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react" // Importer use de React
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { agentService } from "@/lib/agent-service"
import { AlertCircle, FileText, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function AgentInvoicesPage({ params }) {
  const router = useRouter()
  // Utiliser use() pour déballer la Promise params
  const resolvedParams = use(params)
  const agentId = resolvedParams.id
  
  const [agent, setAgent] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // État pour le dialogue d'ajout de facture
  const [showAddInvoiceDialog, setShowAddInvoiceDialog] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [clientName, setClientName] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  useEffect(() => {
    const fetchAgentAndInvoices = async () => {
      try {
        // Récupérer les détails de l'agent
        const agentData = await agentService.getAgentById(agentId)
        setAgent(agentData)
        
        // Récupérer les factures de l'agent
        const invoicesData = await agentService.getInvoicesByAgentId(agentId)
        setInvoices(invoicesData)
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching agent data:", error)
        setError("Impossible de charger les données de l'agent")
        setLoading(false)
      }
    }
    
    fetchAgentAndInvoices()
  }, [agentId])
  
  const handleAddInvoice = async () => {
    // Validation
    if (!invoiceNumber.trim()) {
      setError("Le numéro de facture est requis")
      return
    }
    
    if (!clientName.trim()) {
      setError("Le nom du client est requis")
      return
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Le montant doit être un nombre positif")
      return
    }
    
    if (!dueDate) {
      setError("La date d'échéance est requise")
      return
    }
    
    setIsSubmitting(true)
    setError("")
    
    try {
      // Préparer les données de la facture
      const invoiceData = {
        invoiceNumber: invoiceNumber.trim(),
        clientName: clientName.trim(),
        amount: parseFloat(amount),
        dueDate: new Date(dueDate).toISOString(),
        description: description.trim()
      }
      
      // Ajouter la facture à l'agent
      const updatedAgent = await agentService.addInvoiceToAgent(agentId, invoiceData)
      
      // Mettre à jour l'état local
      setAgent(updatedAgent)
      setInvoices(updatedAgent.invoices)
      
      // Réinitialiser le formulaire
      setInvoiceNumber("")
      setClientName("")
      setAmount("")
      setDueDate("")
      setDescription("")
      
      // Fermer le dialogue
      setShowAddInvoiceDialog(false)
      setIsSubmitting(false)
    } catch (error) {
      console.error("Error adding invoice:", error)
      setError("Une erreur s'est produite lors de l'ajout de la facture")
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteInvoice = async (invoiceId) => {
    try {
      // Supprimer la facture
      await agentService.deleteInvoice(agentId, invoiceId)
      
      // Mettre à jour l'état local
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId))
    } catch (error) {
      console.error("Error deleting invoice:", error)
      setError("Une erreur s'est produite lors de la suppression de la facture")
    }
  }
  
  if (loading) {
    return (
      <div className="w-full text-center py-12">
        <p>Chargement des données...</p>
      </div>
    )
  }
  
  if (!agent && !loading) {
    return (
      <div className="w-full">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>Agent non trouvé</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/dashboard/agents")}>
          Retour à la liste des agents
        </Button>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.role}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/agents")}>
            Retour
          </Button>
          <Button onClick={() => setShowAddInvoiceDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une facture
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
          <CardDescription>
            Liste des factures associées à cet agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">Aucune facture</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Cet agent n'a pas encore de factures associées.
              </p>
              <Button className="mt-4" onClick={() => setShowAddInvoiceDialog(true)}>
                Ajouter une facture
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date d'échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{invoice.amount ? Number(invoice.amount).toFixed(2) : '0.00'} €</TableCell>
                      <TableCell>
                        {invoice.dueDate && invoice.dueDate !== "" ? 
                          (() => {
                            try {
                              return format(new Date(invoice.dueDate), "dd/MM/yyyy");
                            } catch (e) {
                              return "Date invalide";
                            }
                          })() : "Non définie"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === "PAID" 
                            ? "bg-green-100 text-green-800" 
                            : invoice.status === "OVERDUE"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {invoice.status === "PAID" 
                            ? "Payée" 
                            : invoice.status === "OVERDUE"
                            ? "En retard"
                            : "En attente"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer la facture "{invoice.invoiceNumber}" ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteInvoice(invoice.id)} 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialogue d'ajout de facture */}
      <Dialog open={showAddInvoiceDialog} onOpenChange={setShowAddInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une facture</DialogTitle>
            <DialogDescription>
              Créez une nouvelle facture pour l'agent {agent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Numéro de facture</Label>
              <Input
                id="invoice-number"
                placeholder="ex: FACT-2025-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-name">Nom du client</Label>
              <Input
                id="client-name"
                placeholder="ex: Entreprise ABC"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="ex: 1250.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Date d'échéance</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="ex: Prestation de services pour le mois d'avril 2025"
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInvoiceDialog(false)}>Annuler</Button>
            <Button onClick={handleAddInvoice} disabled={isSubmitting}>
              {isSubmitting ? "Ajout en cours..." : "Ajouter la facture"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
