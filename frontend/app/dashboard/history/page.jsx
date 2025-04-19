"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Calendar, Bot } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HistoryPage() {
  const router = useRouter()
  const [executions, setExecutions] = useState([])
  const [agents, setAgents] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredExecutions, setFilteredExecutions] = useState([])

  useEffect(() => {
    // Load executions from localStorage
    const savedExecutions = localStorage.getItem("executions")
    if (savedExecutions) {
      const parsedExecutions = JSON.parse(savedExecutions)
      setExecutions(parsedExecutions)
      setFilteredExecutions(parsedExecutions)
    }

    // Load agents from localStorage
    const savedAgents = localStorage.getItem("agents")
    if (savedAgents) {
      setAgents(JSON.parse(savedAgents))
    }
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredExecutions(executions)
    } else {
      const filtered = executions.filter(
        (execution) =>
          execution.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          execution.invoices?.some((doc) => doc.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          execution.missionOrders?.some((doc) => doc.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          execution.result.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredExecutions(filtered)
    }
  }, [searchTerm, executions])

  const handleViewResult = (executionId) => {
    router.push(`/dashboard/result?executionId=${executionId}`)
  }

  const filterByResult = (result) => {
    if (result === "all") {
      setFilteredExecutions(executions)
    } else {
      const filtered = executions.filter(
        (execution) => execution.result === (result === "legitimate" ? "Légitime" : "Frauduleux"),
      )
      setFilteredExecutions(filtered)
    }
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
                placeholder="Rechercher par nom d'agent, nom de document ou résultat..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full mt-4">
            <TabsList className="w-full flex bg-muted/50">
              <TabsTrigger value="all" className="flex-1" onClick={() => filterByResult("all")}>
                Tous
              </TabsTrigger>
              <TabsTrigger value="legitimate" className="flex-1" onClick={() => filterByResult("legitimate")}>
                Légitimes
              </TabsTrigger>
              <TabsTrigger value="fraudulent" className="flex-1" onClick={() => filterByResult("fraudulent")}>
                Frauduleux
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <HistoryList executions={filteredExecutions} onViewResult={handleViewResult} />
            </TabsContent>
            <TabsContent value="legitimate" className="mt-4">
              <HistoryList executions={filteredExecutions} onViewResult={handleViewResult} />
            </TabsContent>
            <TabsContent value="fraudulent" className="mt-4">
              <HistoryList executions={filteredExecutions} onViewResult={handleViewResult} />
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
}

function HistoryList({ executions, onViewResult }) {
  if (executions.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-muted-foreground mb-4">Aucun historique d'exécution trouvé</p>
          <Button asChild>
            <a href="/dashboard/create">Créer un agent</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {executions.map((execution) => (
        <div
          key={execution.id}
          className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors w-full"
        >
          <div className="space-y-2 mb-4 md:mb-0">
            <div className="flex items-center">
              <Bot className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">{execution.agentName}</span>
              {execution.agentDeleted && (
                <Badge variant="outline" size="sm" className="ml-2 text-xs bg-muted text-muted-foreground">
                  Agent supprimé
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{new Date(execution.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {execution.invoices && execution.invoices.length > 0 && (
                <div className="flex items-center text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  <FileText className="h-3 w-3 mr-1 text-blue-500" />
                  {execution.invoices.length} facture(s)
                </div>
              )}
              {execution.missionOrders && execution.missionOrders.length > 0 && (
                <div className="flex items-center text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                  <FileText className="h-3 w-3 mr-1 text-green-500" />
                  {execution.missionOrders.length} ordre(s) du jour
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge
              variant={execution.result === "Légitime" ? "outline" : "destructive"}
              className={`${
                execution.result === "Légitime"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800"
                  : ""
              }`}
            >
              {execution.result}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => onViewResult(execution.id)}>
              Voir détails
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
