package com.optiagent.backend.controller;

import com.optiagent.backend.model.Execution;
import com.optiagent.backend.service.ExecutionService;
import com.optiagent.backend.service.AnalysisResultService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/executions")
@CrossOrigin(origins = "http://localhost:3000")
public class ExecutionController {

    private final ExecutionService executionService;
    private final AnalysisResultService analysisResultService;

    public ExecutionController(ExecutionService executionService, AnalysisResultService analysisResultService) {
        this.executionService = executionService;
        this.analysisResultService = analysisResultService;
    }

    @GetMapping
    public ResponseEntity<List<Execution>> getAllExecutions() {
        return ResponseEntity.ok(executionService.getAllExecutions());
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<Execution>> getExecutionsByAgentId(@PathVariable String agentId) {
        return ResponseEntity.ok(executionService.getExecutionsByAgentId(agentId));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Execution>> getExecutionsByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(executionService.getExecutionsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Execution> getExecutionById(@PathVariable String id) {
        return executionService.getExecutionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/start/{agentId}")
    public ResponseEntity<Execution> startExecution(
            @PathVariable String agentId,
            @RequestParam(required = false) String userId) {
        try {
            Execution execution = executionService.startExecution(agentId, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(execution);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Execution> completeExecution(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        
        String result = payload.getOrDefault("result", "");
        String notes = payload.getOrDefault("notes", "");
        
        return executionService.completeExecution(id, result, notes)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/fail")
    public ResponseEntity<Execution> failExecution(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        
        String error = payload.getOrDefault("error", "Erreur inconnue");
        
        return executionService.failExecution(id, error)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExecution(@PathVariable String id) {
        if (executionService.deleteExecution(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Enregistre les résultats d'analyse d'une exécution
     * @param id ID de l'exécution
     * @param analysisResults Résultats de l'analyse
     * @return L'exécution mise à jour avec les résultats
     */
    @PostMapping("/{id}/results")
    public ResponseEntity<?> saveAnalysisResults(
            @PathVariable String id,
            @RequestBody Map<String, Object> analysisResults) {
        
        // Vérifier si l'exécution existe
        Optional<Execution> executionOpt = executionService.getExecutionById(id);
        if (!executionOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        // Enregistrer les résultats d'analyse dans la collection dédiée
        return analysisResultService.saveAnalysisResult(id, analysisResults)
                .map(result -> {
                    // Mettre à jour le statut de l'exécution
                    executionService.completeExecution(id, "Analyse terminée avec succès", "Résultats enregistrés dans la collection analysis_results");
                    return ResponseEntity.status(HttpStatus.CREATED).body(result);
                })
                .orElse(ResponseEntity.badRequest().build());
    }
}
