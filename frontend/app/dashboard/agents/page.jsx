"use client"

import { useState, useEffect } from "react"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger 
} from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bot, Plus, Trash2, Eye, Search as SearchIcon, Filter, ArrowUpDown, File, FileText, Edit } from "lucide-react"
import { format } from "date-fns"

export default function AgentsManagementPage() {
  const router = useRouter()
  const [agents, setAgents] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDirection, setSortDirection] = useState("desc")
  
  // État pour l'édition d'agent
  const [editingAgent, setEditingAgent] = useState(null)
  const [editedName, setEditedName] = useState("")
  const [editedRole, setEditedRole] = useState("")
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  // Recherche avancée
  const [advancedSearchTerm, setAdvancedSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("all")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // Load agents from localStorage
    const storedAgents = JSON.parse(localStorage.getItem("agents") || "[]")
    setAgents(storedAgents)
  }, [])

  // Fonction pour éditer un agent
  const handleEditAgent = (agent) => {
    setEditingAgent(agent)
    setEditedName(agent.name)
    setEditedRole(agent.role)
    setShowEditDialog(true)
  }
  
  // Fonction pour sauvegarder les modifications d'un agent
  const saveAgentChanges = () => {
    if (!editedName.trim()) {
      return // Ne pas sauvegarder si le nom est vide
    }
    
    try {
      // Mettre à jour l'agent dans la liste
      const updatedAgents = agents.map(agent => {
        if (agent.id === editingAgent.id) {
          return {
            ...agent,
            name: editedName.trim(),
            role: editedRole.trim()
          }
        }
        return agent
      })
      
      // Mettre à jour localStorage
      localStorage.setItem("agents", JSON.stringify(updatedAgents))
      
      // Mettre à jour l'état
      setAgents(updatedAgents)
      
      // Mettre à jour les exécutions qui référencent cet agent
      const executions = JSON.parse(localStorage.getItem("executions") || "[]")
      const updatedExecutions = executions.map(execution => {
        if (execution.agentId === editingAgent.id) {
          return {
            ...execution,
            agentName: editedName.trim()
          }
        }
        return execution
      })
      
      // Sauvegarder les exécutions mises à jour
      localStorage.setItem("executions", JSON.stringify(updatedExecutions))
      
      // Fermer le dialogue
      setShowEditDialog(false)
    } catch (error) {
      console.error("Error updating agent:", error)
    }
  }
  
  const handleDeleteAgent = (id) => {
    try {
      // Filter out the agent to be deleted
      const updatedAgents = agents.filter(agent => agent.id !== id)
      
      // Update localStorage for agents
      localStorage.setItem("agents", JSON.stringify(updatedAgents))
      
      // Update state
      setAgents(updatedAgents)
      
      // Completely remove all executions related to this agent
      const executions = JSON.parse(localStorage.getItem("executions") || "[]")
      const filteredExecutions = executions.filter(execution => execution.agentId !== id)
      
      // Save updated executions without any trace of the deleted agent
      localStorage.setItem("executions", JSON.stringify(filteredExecutions))
      
    } catch (error) {
      console.error("Error deleting agent:", error)
    }
  }
  
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortBy(field)
      setSortDirection("asc")
    }
  }
  
  // Filter and sort agents
  const filteredAgents = agents
    .filter(agent => 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : 1
      } else {
        return aValue > bValue ? -1 : 1
      }
    })
  
  // Recherche avancée
  const handleAdvancedSearch = () => {
    setIsSearching(true)
    
    // Get data from localStorage
    const agents = JSON.parse(localStorage.getItem("agents") || "[]")
    const executions = JSON.parse(localStorage.getItem("executions") || "[]")
    
    let results = []
    
    // Map agents to a standard result format
    if (searchType === "all" || searchType === "agents") {
      const matchingAgents = agents
        .filter(agent => 
          agent.name.toLowerCase().includes(advancedSearchTerm.toLowerCase()) ||
          agent.role.toLowerCase().includes(advancedSearchTerm.toLowerCase())
        )
        .map(agent => ({
          id: agent.id,
          type: "agent",
          title: agent.name,
          description: agent.role,
          date: agent.createdAt,
          url: `/dashboard/execute?agentId=${agent.id}`
        }))
      
      results = [...results, ...matchingAgents]
    }
    
    // Map executions to a standard result format
    if (searchType === "all" || searchType === "executions") {
      const matchingExecutions = executions
        .filter(execution => 
          execution.agentName.toLowerCase().includes(advancedSearchTerm.toLowerCase()) ||
          execution.result.toLowerCase().includes(advancedSearchTerm.toLowerCase())
        )
        .map(execution => ({
          id: execution.id,
          type: "execution",
          title: `Exécution: ${execution.agentName}`,
          description: `Résultat: ${execution.result}`,
          date: execution.timestamp,
          url: `/dashboard/result?executionId=${execution.id}`
        }))
      
      results = [...results, ...matchingExecutions]
    }
    
    // Sort by date descending
    results.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    setSearchResults(results)
    setIsSearching(false)
  }
  
  // Search when term changes or on enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAdvancedSearch()
    }
  }
  
  // Get icon for result type
  const getTypeIcon = (type) => {
    switch (type) {
      case "agent":
        return <Bot className="h-4 w-4" />
      case "execution":
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="management" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="management">Gestion des agents</TabsTrigger>
          <TabsTrigger value="search">Recherche avancée</TabsTrigger>
        </TabsList>
        
        {/* Onglet Gestion des agents */}
        <TabsContent value="management" className="w-full">
          <Card className="w-full border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="text-2xl font-bold">Gestion des Agents</CardTitle>
                  <CardDescription>
                    Gérez et organisez vos agents d'automatisation
                  </CardDescription>
                </div>
                <Link href="/dashboard/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un agent
                  </Button>
                </Link>
      </div>
              <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
                  <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
                    placeholder="Rechercher par nom ou rôle..."
            value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full"
          />
        </div>
                    </div>
                  </CardHeader>
            <CardContent className="px-0">
              {agents.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <Bot className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">Aucun agent trouvé</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Vous n'avez pas encore créé d'agents. Commencez par en créer un nouveau.
                  </p>
                  <Link href="/dashboard/create">
                    <Button className="mt-4">
                      Créer votre premier agent
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="w-full rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px] cursor-pointer" onClick={() => handleSort("name")}>
                          <div className="flex items-center">
                            Nom
                            <ArrowUpDown className={`ml-2 h-4 w-4 ${sortBy === "name" ? "opacity-100" : "opacity-40"}`} />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("role")}>
                          <div className="flex items-center">
                            Rôle
                            <ArrowUpDown className={`ml-2 h-4 w-4 ${sortBy === "role" ? "opacity-100" : "opacity-40"}`} />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                          <div className="flex items-center">
                            Date de création
                            <ArrowUpDown className={`ml-2 h-4 w-4 ${sortBy === "createdAt" ? "opacity-100" : "opacity-40"}`} />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAgents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                            Aucun résultat pour votre recherche
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAgents.map((agent) => (
                          <TableRow key={agent.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Bot className="mr-2 h-4 w-4 text-muted-foreground" />
                                {agent.name}
                              </div>
                            </TableCell>
                            <TableCell>{agent.role}</TableCell>
                            <TableCell>
                              {format(new Date(agent.createdAt), "dd/MM/yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                                  onClick={() => handleEditAgent(agent)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Link href={`/dashboard/execute?agentId=${agent.id}`}>
                                  <Button variant="outline" size="icon">
                                    <Eye className="h-4 w-4" />
                    </Button>
                                </Link>
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
                                        Êtes-vous sûr de vouloir supprimer l'agent "{agent.name}" ? Cette action est irréversible.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteAgent(agent.id)} 
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-4 text-sm text-muted-foreground">
                {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} au total
              </div>
            </CardContent>
            </Card>
        </TabsContent>
        
        {/* Onglet Recherche avancée */}
        <TabsContent value="search" className="w-full">
          <Card className="w-full border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-bold">Recherche avancée</CardTitle>
              <CardDescription>
                Recherchez parmi vos agents et exécutions
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid gap-4 md:grid-cols-12 w-full">
                <div className="md:col-span-9 space-y-2">
                  <Label htmlFor="search">
                    Recherche
                  </Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Rechercher..."
                      className="pl-8 w-full"
                      value={advancedSearchTerm}
                      onChange={(e) => setAdvancedSearchTerm(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                  </div>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="type">
                    Type
                  </Label>
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Type de recherche" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les résultats</SelectItem>
                      <SelectItem value="agents">Agents</SelectItem>
                      <SelectItem value="executions">Exécutions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-12">
                  <Button 
                    className="w-full" 
                    onClick={handleAdvancedSearch}
                    disabled={!advancedSearchTerm.trim() || isSearching}
                  >
                    {isSearching ? "Recherche en cours..." : "Rechercher"}
                  </Button>
                </div>
              </div>
              
              {advancedSearchTerm && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">
                    {searchResults.length > 0 
                      ? `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''} pour "${advancedSearchTerm}"` 
                      : `Aucun résultat pour "${advancedSearchTerm}"`}
                  </h3>
                  
                  {searchResults.length > 0 && (
                    <div className="rounded-md border overflow-hidden w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Titre</TableHead>
                            <TableHead className="w-[200px]">Description</TableHead>
                            <TableHead className="w-[150px]">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((result) => (
                            <TableRow key={`${result.type}-${result.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getTypeIcon(result.type)}
                                  <span className="capitalize">{result.type}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Link 
                                  href={result.url}
                                  className="text-primary hover:underline"
                                >
                                  {result.title}
                                </Link>
                              </TableCell>
                              <TableCell className="truncate max-w-[200px]">
                                {result.description}
                              </TableCell>
                              <TableCell>
                                {format(new Date(result.date), "dd/MM/yyyy HH:mm")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
        )}
      </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog d'édition d'agent */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'agent</DialogTitle>
            <DialogDescription>
              Modifiez les informations de votre agent.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de l'agent</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Nom de l'agent"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rôle de l'agent</Label>
              <Textarea
                id="role"
                value={editedRole}
                onChange={(e) => setEditedRole(e.target.value)}
                placeholder="Décrivez le rôle de cet agent"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveAgentChanges}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}