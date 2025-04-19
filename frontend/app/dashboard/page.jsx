"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, FileCheck, AlertTriangle, Plus, BarChart3, Clock } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const [agents, setAgents] = useState([])
  const [recentExecutions, setRecentExecutions] = useState([])

  useEffect(() => {
    // Load agents from localStorage
    const savedAgents = localStorage.getItem("agents")
    if (savedAgents) {
      setAgents(JSON.parse(savedAgents))
    } else {
      // S'assurer que les agents sont un tableau vide
      setAgents([])
      // Initialiser le localStorage avec un tableau vide si nécessaire
      localStorage.setItem("agents", JSON.stringify([]))
    }

    // Load executions from localStorage
    const savedExecutions = localStorage.getItem("executions")
    if (savedExecutions) {
      const executions = JSON.parse(savedExecutions)
      setRecentExecutions(executions.slice(0, 5)) // Get 5 most recent
    } else {
      // S'assurer que les exécutions sont un tableau vide
      setRecentExecutions([])
      // Initialiser le localStorage avec un tableau vide si nécessaire
      localStorage.setItem("executions", JSON.stringify([]))
    }
  }, [])

  const legitimateCount = recentExecutions.filter((exec) => exec.result === "Légitime").length
  const fraudulentCount = recentExecutions.filter((exec) => exec.result === "Frauduleux").length
  const totalInvoices = recentExecutions.reduce((acc, exec) => acc + (exec.invoices?.length || 0), 0)
  const totalMissionOrders = recentExecutions.reduce((acc, exec) => acc + (exec.missionOrders?.length || 0), 0)

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Agents</CardTitle>
                <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{agents.length}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {agents.length === 0 ? "Aucun agent créé" : "Agents prêts à l'exécution"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Documents légitimes</CardTitle>
                <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">{legitimateCount}</div>
                <p className="text-xs text-green-600 dark:text-green-400">Documents vérifiés comme légitimes</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Documents frauduleux</CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700 dark:text-red-300">{fraudulentCount}</div>
                <p className="text-xs text-red-600 dark:text-red-400">Documents signalés comme frauduleux</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total documents</CardTitle>
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {totalInvoices + totalMissionOrders}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {totalInvoices} factures, {totalMissionOrders} ordres du jour
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Liste des factures</CardTitle>
              <CardDescription>Statut de vérification des factures</CardDescription>
            </CardHeader>
            <CardContent>
              {recentExecutions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune exécution pour le moment</p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/create">Créer votre premier agent</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {recentExecutions.map((execution, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-6 last:border-0">
                      <div>
                        <p className="font-medium">
                          {execution.agentName}
                          {execution.agentDeleted && (
                            <span className="text-xs bg-muted text-muted-foreground ml-2 px-1.5 py-0.5 rounded">
                              Agent supprimé
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{new Date(execution.timestamp).toLocaleString()}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {execution.invoices &&
                            execution.invoices.map((doc, idx) => (
                              <span key={idx} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {doc.name}
                              </span>
                            ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            execution.result === "Légitime"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          }`}
                        >
                          {execution.result}
                        </span>
                        {execution.result === "Frauduleux" && (
                          <span className="text-xs text-red-600 dark:text-red-400 max-w-[200px] text-right">
                            {execution.reason}
                          </span>
                        )}
                        <Button variant="outline" size="sm" asChild className="mt-1">
                          <Link href={`/dashboard/result?executionId=${execution.id}`}>Consulter</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
