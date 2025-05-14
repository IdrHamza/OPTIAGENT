package com.optiagent.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "analysis_results")
public class AnalysisResult {
    @Id
    private String id;
    private String executionId;  // Référence à l'exécution associée
    private String agentId;      // Référence à l'agent associé
    private String userId;       // Référence à l'utilisateur propriétaire
    private LocalDateTime createdAt;
    private Map<String, Object> results;  // Résultats détaillés de l'analyse
    
    // Champs structurés pour les résultats d'analyse de factures
    private String fileName;     // Nom du fichier analysé
    private String fraudStatus;  // Statut de fraude (Oui/Non)
    private String storeName;    // Nom du commerce
    private String invoiceDate;  // Date de la facture
    private Double totalAmount;  // Montant total
    private String city;         // Ville
    private String fullAddress;  // Adresse complète
    private List<String> fraudReasons; // Raisons de la fraude

    public AnalysisResult() {
        this.createdAt = LocalDateTime.now();
    }

    public AnalysisResult(String executionId, String agentId, String userId, Map<String, Object> results) {
        this.executionId = executionId;
        this.agentId = agentId;
        this.userId = userId;
        this.results = results;
        this.createdAt = LocalDateTime.now();
        
        // Extraire les champs structurés des résultats si disponibles
        extractStructuredFields(results);
    }
    
    /**
     * Constructeur complet avec tous les champs structurés
     */
    public AnalysisResult(String executionId, String agentId, String userId, Map<String, Object> results,
                          String fileName, String fraudStatus, String storeName, String invoiceDate,
                          Double totalAmount, String city, String fullAddress, List<String> fraudReasons) {
        this.executionId = executionId;
        this.agentId = agentId;
        this.userId = userId;
        this.results = results;
        this.createdAt = LocalDateTime.now();
        this.fileName = fileName;
        this.fraudStatus = fraudStatus;
        this.storeName = storeName;
        this.invoiceDate = invoiceDate;
        this.totalAmount = totalAmount;
        this.city = city;
        this.fullAddress = fullAddress;
        this.fraudReasons = fraudReasons;
    }
    
    /**
     * Extrait les champs structurés à partir des résultats JSON
     */
    @SuppressWarnings("unchecked")
    private void extractStructuredFields(Map<String, Object> results) {
        if (results == null) return;
        
        try {
            System.out.println("Extraction des champs structurés à partir des résultats: " + results.keySet());
            
            // Cas 1: Les résultats sont déjà au format attendu
            if (results.containsKey("fraude") || results.containsKey("Nom du commerce")) {
                System.out.println("Format 1: Les résultats sont déjà au format attendu");
                this.fraudStatus = getStringValue(results, "fraude");
                this.storeName = getStringValue(results, "Nom du commerce");
                this.invoiceDate = getStringValue(results, "Date de la facture");
                this.totalAmount = getDoubleValue(results, "Montant total");
                this.city = getStringValue(results, "Ville");
                this.fullAddress = getStringValue(results, "Adresse complète");
                
                if (results.containsKey("raison") && results.get("raison") instanceof List) {
                    this.fraudReasons = (List<String>) results.get("raison");
                }
            }
            // Cas 2: Les résultats sont dans une propriété "résultats"
            else if (results.containsKey("résultats")) {
                System.out.println("Format 2: Les résultats sont dans une propriété 'résultats'");
                Object resultsObj = results.get("résultats");
                
                if (resultsObj instanceof List) {
                    List<Map<String, Object>> resultsList = (List<Map<String, Object>>) resultsObj;
                    if (!resultsList.isEmpty()) {
                        Map<String, Object> firstResult = resultsList.get(0);
                        this.fraudStatus = getStringValue(firstResult, "fraude");
                        this.storeName = getStringValue(firstResult, "Nom du commerce");
                        this.invoiceDate = getStringValue(firstResult, "Date de la facture");
                        this.totalAmount = getDoubleValue(firstResult, "Montant total");
                        this.city = getStringValue(firstResult, "Ville");
                        this.fullAddress = getStringValue(firstResult, "Adresse complète");
                        
                        if (firstResult.containsKey("raison") && firstResult.get("raison") instanceof List) {
                            this.fraudReasons = (List<String>) firstResult.get("raison");
                        }
                    }
                } else if (resultsObj instanceof Map) {
                    Map<String, Object> resultsMap = (Map<String, Object>) resultsObj;
                    this.fraudStatus = getStringValue(resultsMap, "fraude");
                    this.storeName = getStringValue(resultsMap, "Nom du commerce");
                    this.invoiceDate = getStringValue(resultsMap, "Date de la facture");
                    this.totalAmount = getDoubleValue(resultsMap, "Montant total");
                    this.city = getStringValue(resultsMap, "Ville");
                    this.fullAddress = getStringValue(resultsMap, "Adresse complète");
                    
                    if (resultsMap.containsKey("raison") && resultsMap.get("raison") instanceof List) {
                        this.fraudReasons = (List<String>) resultsMap.get("raison");
                    }
                }
            }
            // Cas 3: Recherche des champs par nom similaire
            else {
                System.out.println("Format 3: Recherche des champs par nom similaire");
                for (String key : results.keySet()) {
                    String lowerKey = key.toLowerCase();
                    if (lowerKey.contains("fraude")) this.fraudStatus = getStringValue(results, key);
                    if (lowerKey.contains("commerce")) this.storeName = getStringValue(results, key);
                    if (lowerKey.contains("date") && lowerKey.contains("facture")) this.invoiceDate = getStringValue(results, key);
                    if (lowerKey.contains("montant") || lowerKey.contains("total")) this.totalAmount = getDoubleValue(results, key);
                    if (lowerKey.contains("ville")) this.city = getStringValue(results, key);
                    if (lowerKey.contains("adresse")) this.fullAddress = getStringValue(results, key);
                    if ((lowerKey.contains("raison") || lowerKey.contains("reason")) && results.get(key) instanceof List) {
                        this.fraudReasons = (List<String>) results.get(key);
                    }
                }
            }
            
            // Afficher les champs extraits pour débogage
            System.out.println("Champs extraits: fraude=" + this.fraudStatus + ", commerce=" + this.storeName + 
                              ", date=" + this.invoiceDate + ", montant=" + this.totalAmount + ", ville=" + this.city + 
                              ", adresse=" + this.fullAddress + ", raisons=" + (this.fraudReasons != null ? this.fraudReasons.size() : "null"));
            
        } catch (Exception e) {
            // En cas d'erreur, ne pas bloquer la création de l'objet mais afficher l'erreur
            System.err.println("Erreur lors de l'extraction des champs structurés: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Méthode utilitaire pour extraire une valeur String d'un Map
     */
    private String getStringValue(Map<String, Object> map, String key) {
        if (map.containsKey(key) && map.get(key) != null) {
            return map.get(key).toString();
        }
        return null;
    }
    
    /**
     * Méthode utilitaire pour extraire une valeur Double d'un Map
     */
    private Double getDoubleValue(Map<String, Object> map, String key) {
        if (map.containsKey(key) && map.get(key) != null) {
            try {
                if (map.get(key) instanceof Number) {
                    return ((Number) map.get(key)).doubleValue();
                } else {
                    return Double.parseDouble(map.get(key).toString());
                }
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getExecutionId() {
        return executionId;
    }

    public void setExecutionId(String executionId) {
        this.executionId = executionId;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Map<String, Object> getResults() {
        return results;
    }

    public void setResults(Map<String, Object> results) {
        this.results = results;
        // Mettre à jour les champs structurés lorsque les résultats sont mis à jour
        extractStructuredFields(results);
    }
    
    // Getters et Setters pour les nouveaux champs
    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFraudStatus() {
        return fraudStatus;
    }

    public void setFraudStatus(String fraudStatus) {
        this.fraudStatus = fraudStatus;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(String invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getFullAddress() {
        return fullAddress;
    }

    public void setFullAddress(String fullAddress) {
        this.fullAddress = fullAddress;
    }

    public List<String> getFraudReasons() {
        return fraudReasons;
    }

    public void setFraudReasons(List<String> fraudReasons) {
        this.fraudReasons = fraudReasons;
    }
}
