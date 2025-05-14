package com.optiagent.backend.controller;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Contrôleur ultra simple pour tester l'enregistrement des résultats dans MongoDB
 * sans aucune dépendance sur d'autres services
 */
@RestController
@RequestMapping("/api/simple-results")
@CrossOrigin(origins = "*")
public class SimpleResultController {

    private final MongoTemplate mongoTemplate;

    public SimpleResultController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> saveTestResult(@RequestBody Map<String, Object> data) {
        try {
            // Créer un document simple avec les données reçues
            Map<String, Object> document = new HashMap<>(data);
            
            // Ajouter un timestamp
            document.put("timestamp", LocalDateTime.now().toString());
            
            // Enregistrer dans MongoDB dans une collection simple
            Map<String, Object> savedDocument = mongoTemplate.save(document, "simple_results");
            
            return ResponseEntity.ok(savedDocument);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/test")
    public ResponseEntity<List<Map<String, Object>>> getAllResults() {
        try {
            // Récupérer tous les documents de la collection
            List<Map<String, Object>> results = mongoTemplate.findAll(Map.class, "simple_results")
                .stream()
                .map(map -> (Map<String, Object>) map)
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }
}
