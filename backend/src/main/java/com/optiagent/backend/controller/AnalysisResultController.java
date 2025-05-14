package com.optiagent.backend.controller;

import com.optiagent.backend.model.AnalysisResult;
import com.optiagent.backend.model.Execution;
import com.optiagent.backend.repository.ExecutionRepository;
import com.optiagent.backend.service.AnalysisResultService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/analysis-results")
@CrossOrigin(origins = "http://localhost:3000")
public class AnalysisResultController {

    private final AnalysisResultService analysisResultService;
    private final MongoTemplate mongoTemplate;
    private final ExecutionRepository executionRepository;

    public AnalysisResultController(AnalysisResultService analysisResultService, 
                                  MongoTemplate mongoTemplate,
                                  ExecutionRepository executionRepository) {
        this.analysisResultService = analysisResultService;
        this.mongoTemplate = mongoTemplate;
        this.executionRepository = executionRepository;
    }

    @GetMapping
    public ResponseEntity<List<AnalysisResult>> getAllAnalysisResults() {
        return ResponseEntity.ok(analysisResultService.getAllAnalysisResults());
    }

    @GetMapping("/execution/{executionId}")
    public ResponseEntity<List<AnalysisResult>> getAnalysisResultsByExecutionId(@PathVariable String executionId) {
        return ResponseEntity.ok(analysisResultService.getAnalysisResultsByExecutionId(executionId));
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<AnalysisResult>> getAnalysisResultsByAgentId(@PathVariable String agentId) {
        return ResponseEntity.ok(analysisResultService.getAnalysisResultsByAgentId(agentId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AnalysisResult>> getAnalysisResultsByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(analysisResultService.getAnalysisResultsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnalysisResult> getAnalysisResultById(@PathVariable String id) {
        return analysisResultService.getAnalysisResultById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/execution/{executionId}")
    public ResponseEntity<Map<String, Object>> saveAnalysisResult(
            @PathVariable String executionId,
            @RequestBody Map<String, Object> results) {
        
        System.out.println("=== Contrôleur: Requête reçue pour saveAnalysisResult ====");
        System.out.println("ExecutionId: " + executionId);
        System.out.println("Taille des résultats: " + (results != null ? results.size() : "null"));
        System.out.println("Clés des résultats: " + (results != null ? results.keySet() : "null"));
        
        // Vérifier que les résultats ne sont pas null ou vides
        if (results == null || results.isEmpty()) {
            System.err.println("=== Contrôleur: Erreur - Résultats null ou vides ====");
            return ResponseEntity.badRequest().build();
        }
        
        // Vérifier que l'ID d'exécution est valide
        if (executionId == null || executionId.isEmpty()) {
            System.err.println("=== Contrôleur: Erreur - ID d'exécution null ou vide ====");
            return ResponseEntity.badRequest().build();
        }
        
        try {
            // Récupérer l'exécution pour obtenir les IDs associés
            Optional<Execution> executionOpt = executionRepository.findById(executionId);
            if (!executionOpt.isPresent()) {
                System.err.println("=== Contrôleur: Erreur - Exécution non trouvée pour l'ID: " + executionId + " ====");
                return ResponseEntity.badRequest().build();
            }
            
            Execution execution = executionOpt.get();
            
            // Extraire les champs structurés des résultats
            Map<String, Object> document = new HashMap<>();
            
            // Informations de base
            document.put("executionId", executionId);
            document.put("agentId", execution.getAgentId());
            document.put("userId", execution.getUserId());
            document.put("dateCreation", java.time.LocalDateTime.now().toString());
            
            // Extraire les champs spécifiques des résultats
            if (results.containsKey("résultats") && results.get("résultats") instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> resultsList = (List<Map<String, Object>>) results.get("résultats");
                if (!resultsList.isEmpty()) {
                    Map<String, Object> firstResult = resultsList.get(0);
                    
                    // Stocker directement les champs structurés au premier niveau du document
                    document.put("fraude", firstResult.getOrDefault("fraude", "Non"));
                    document.put("Nom du commerce", firstResult.getOrDefault("Nom du commerce", "inconnu"));
                    document.put("Date de la facture", firstResult.getOrDefault("Date de la facture", ""));
                    document.put("Montant total", firstResult.getOrDefault("Montant total", 0));
                    document.put("Ville", firstResult.getOrDefault("Ville", ""));
                    document.put("Adresse complète", firstResult.getOrDefault("Adresse complète", ""));
                    
                    // Stocker les raisons de la fraude
                    if (firstResult.containsKey("raison") && firstResult.get("raison") instanceof List) {
                        document.put("raison", firstResult.get("raison"));
                    }
                }
            } else {
                // Si les résultats ne sont pas dans le format attendu, stocker directement les champs
                document.put("fraude", results.getOrDefault("fraude", "Non"));
                document.put("Nom du commerce", results.getOrDefault("Nom du commerce", "inconnu"));
                document.put("Date de la facture", results.getOrDefault("Date de la facture", ""));
                document.put("Montant total", results.getOrDefault("Montant total", 0));
                document.put("Ville", results.getOrDefault("Ville", ""));
                document.put("Adresse complète", results.getOrDefault("Adresse complète", ""));
                
                // Stocker les raisons de la fraude
                if (results.containsKey("raison") && results.get("raison") instanceof List) {
                    document.put("raison", results.get("raison"));
                }
            }
            
            // Insérer directement dans MongoDB dans une collection dédiée
            Map<String, Object> savedDocument = mongoTemplate.save(document, "execution_results");
            System.out.println("=== Contrôleur: Résultat enregistré directement dans MongoDB, collection: execution_results ====");
            
            // Essayer également d'enregistrer via le service normal
            try {
                analysisResultService.saveAnalysisResult(executionId, results);
                System.out.println("=== Contrôleur: Résultat également enregistré via le service normal ====");
            } catch (Exception e) {
                System.err.println("=== Contrôleur: Erreur lors de l'enregistrement via le service normal, mais l'insertion directe a fonctionné ====");
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedDocument);
        } catch (Exception e) {
            System.err.println("=== Contrôleur: Exception lors de l'enregistrement des résultats ====");
            System.err.println("Message d'erreur: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnalysisResult(@PathVariable String id) {
        if (analysisResultService.deleteAnalysisResult(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Marquer une exécution comme échouée
     * @param executionId ID de l'exécution
     * @param errorData Données d'erreur contenant le message
     * @return L'exécution mise à jour
     */
    @PostMapping("/execution/{executionId}/fail")
    public ResponseEntity<Execution> markExecutionAsFailed(
            @PathVariable String executionId,
            @RequestBody Map<String, String> errorData) {
        
        String errorMessage = errorData.getOrDefault("error", "Erreur inconnue");
        
        return analysisResultService.markExecutionAsFailed(executionId, errorMessage)
                .map(execution -> ResponseEntity.ok(execution))
                .orElse(ResponseEntity.notFound().build());
    }
}
