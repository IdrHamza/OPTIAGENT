"use client"

import { getUser } from "./user-store";

const API_URL = "http://localhost:8081/api";

// Fonction utilitaire pour les requêtes API
async function fetchWithAuth(url, options = {}) {
  const user = getUser();
  
  if (!user || !user.token) {
    throw new Error("Non authentifié");
  }
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${user.token}`,
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("API Error:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      errorData
    });
    throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Services d'API pour les utilisateurs
export const userApi = {
  // Récupérer le profil de l'utilisateur courant
  getCurrentUser: async () => {
    return fetchWithAuth(`${API_URL}/users/me`);
  },
  
  // Mettre à jour le profil utilisateur
  updateProfile: async (profileData) => {
    return fetchWithAuth(`${API_URL}/users/profile`, {
      method: "PUT",
      body: JSON.stringify(profileData)
    });
  },
  
  // Changer le mot de passe
  changePassword: async (passwordData) => {
    return fetchWithAuth(`${API_URL}/users/password`, {
      method: "PUT",
      body: JSON.stringify(passwordData)
    });
  },
  
  // Supprimer le compte
  deleteAccount: async () => {
    return fetchWithAuth(`${API_URL}/users/account`, {
      method: "DELETE"
    });
  }
};

// Services d'API pour l'authentification
export const authApi = {
  // Connexion
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Login Error:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || "Échec de la connexion");
      }
      
      return response.json();
    } catch (error) {
      console.error("Login Exception:", error);
      throw error;
    }
  },
  
  // Inscription
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Register Error:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || "Échec de l'inscription");
      }
      
      return response.json();
    } catch (error) {
      console.error("Register Exception:", error);
      throw error;
    }
  }
};
