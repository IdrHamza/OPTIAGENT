"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
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
  User, 
  Upload, 
  Save, 
  ArrowLeft, 
  Shield, 
  Bell, 
  Globe, 
  Trash2, 
  LockKeyhole,
  Eye,
  EyeOff,
  Check,
  XCircle,
  AlertTriangle
} from "lucide-react"
import { getUser, updateUser, clearUser } from "@/lib/user-store"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [message, setMessage] = useState({ type: "", text: "" })
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" })
  
  // Delete account fields
  const [confirmDelete, setConfirmDelete] = useState("")
  
  useEffect(() => {
    const userData = getUser()
    if (!userData) {
      router.push("/")
      return
    }
    
    setUser(userData)
    setName(userData.name || "")
    setEmail(userData.email || "")
    setImagePreview(userData.profileImage || null)
  }, [router])
  
  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }
  
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Veuillez sélectionner une image" })
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "L'image ne doit pas dépasser 2Mo" })
      return
    }
    
    setProfileImage(file)
    
    // Create a preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }
  
  const handleSubmitProfile = async (e) => {
    e.preventDefault()
    setMessage({ type: "", text: "" })
    
    if (!name.trim()) {
      setMessage({ type: "error", text: "Le nom est requis" })
      return
    }
    
    try {
      // Update user data
      const updatedUser = updateUser({
        name,
        profileImage: imagePreview
      })
      
      setUser(updatedUser)
      setMessage({ type: "success", text: "Profil mis à jour avec succès" })
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: "Une erreur est survenue. Veuillez réessayer." })
    }
  }
  
  const handleChangePassword = (e) => {
    e.preventDefault()
    setPasswordMessage({ type: "", text: "" })
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Tous les champs sont requis" })
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Les mots de passe ne correspondent pas" })
      return
    }
    
    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères" })
      return
    }
    
    try {
      // Get the stored users
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const userIndex = users.findIndex(u => u.email === email)
      
      if (userIndex === -1) {
        setPasswordMessage({ type: "error", text: "Utilisateur non trouvé" })
        return
      }
      
      if (users[userIndex].password !== currentPassword) {
        setPasswordMessage({ type: "error", text: "Mot de passe actuel incorrect" })
        return
      }
      
      // Update the password
      users[userIndex].password = newPassword
      localStorage.setItem("users", JSON.stringify(users))
      
      // Clear fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      setPasswordMessage({ type: "success", text: "Mot de passe modifié avec succès" })
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordMessage({ type: "error", text: "Une erreur est survenue. Veuillez réessayer." })
    }
  }
  
  const handleDeleteAccount = () => {
    try {
      // Get the stored users
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = users.filter(u => u.email !== email)
      
      // Update localStorage
      localStorage.setItem("users", JSON.stringify(updatedUsers))
      
      // Remove authentication
      localStorage.removeItem("isAuthenticated")
      clearUser()
      
      // Redirect to login
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
    }
  }
  
  if (!user) {
    return null // Loading state
  }
  
  return (
    <div className="container max-w-4xl mx-auto">
      <div className="flex items-center mb-8 gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Paramètres du profil</h1>
      </div>
      
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center justify-center">
            <User className="mr-2 h-4 w-4" />
            Informations personnelles
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center justify-center">
            <Shield className="mr-2 h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center justify-center">
            <Globe className="mr-2 h-4 w-4" />
            Paramètres avancés
          </TabsTrigger>
        </TabsList>
        
        {/* Onglet Informations personnelles */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Informations personnelles</CardTitle>
              <CardDescription>
                Gérez vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      {imagePreview ? (
                        <AvatarImage src={imagePreview} alt={name} />
                      ) : (
                        <AvatarFallback className="text-2xl">{getInitials(name)}</AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className="flex items-center">
                      <Label 
                        htmlFor="profile-image" 
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Changer l'image
                      </Label>
                      <Input 
                        id="profile-image" 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input 
                        id="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Votre nom" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={email}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        L'adresse email ne peut pas être modifiée
                      </p>
                    </div>
                  </div>
                </div>
                
                {message.text && (
                  <div className={`p-3 rounded-md ${
                    message.type === "error" ? "bg-destructive/15 text-destructive" : 
                    message.type === "success" ? "bg-green-500/15 text-green-600 dark:text-green-400" : ""
                  }`}>
                    {message.type === "success" ? (
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        {message.text}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        {message.text}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button type="submit">
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet Sécurité */}
        <TabsContent value="security">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Modifier le mot de passe</CardTitle>
              <CardDescription>
                Changez votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nouveau mot de passe"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Le mot de passe doit contenir au moins 8 caractères
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmez le nouveau mot de passe"
                    />
                  </div>
                </div>
                
                {passwordMessage.text && (
                  <div className={`p-3 rounded-md ${
                    passwordMessage.type === "error" ? "bg-destructive/15 text-destructive" : 
                    passwordMessage.type === "success" ? "bg-green-500/15 text-green-600 dark:text-green-400" : ""
                  }`}>
                    {passwordMessage.type === "success" ? (
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        {passwordMessage.text}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        {passwordMessage.text}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <Button type="submit" className="mt-2">
                    Changer le mot de passe
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center text-destructive">
                <LockKeyhole className="h-5 w-5 mr-2" />
                Sessions actives
              </CardTitle>
              <CardDescription>
                Gérez vos sessions de connexion actives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session actuelle</p>
                    <p className="text-sm text-muted-foreground">
                      Navigateur: {window.navigator.userAgent.split(' ').slice(-1)[0].split('/')[0]}
                    </p>
                  </div>
                  <Button variant="outline">
                    Actif
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet Avancé */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-destructive flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Supprimer le compte
              </CardTitle>
              <CardDescription>
                Cette action est permanente et irréversible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">
                    La suppression de votre compte est une action permanente et irréversible. 
                    Toutes vos données, y compris vos agents et leur historique, seront définitivement perdues.
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer mon compte
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est permanente et ne peut pas être annulée. Toutes vos données seront définitivement supprimées.
                        <div className="mt-4">
                          <Label htmlFor="confirm-delete">Pour confirmer, tapez "supprimer"</Label>
                          <Input 
                            id="confirm-delete"
                            value={confirmDelete}
                            onChange={(e) => setConfirmDelete(e.target.value)}
                            className="mt-2"
                            placeholder="supprimer"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={confirmDelete !== "supprimer"}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 