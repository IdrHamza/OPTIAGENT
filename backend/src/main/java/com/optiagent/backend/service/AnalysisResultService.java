package com.optiagent.backend.service;

import com.optiagent.backend.model.AnalysisResult;
import com.optiagent.backend.model.Execution;
import com.optiagent.backend.model.User;
import com.optiagent.backend.repository.AnalysisResultRepository;
import com.optiagent.backend.repository.ExecutionRepository;
import com.optiagent.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AnalysisResultService {

    private final AnalysisResultRepository analysisResultRepository;
    private final ExecutionRepository executionRepository;
    private final UserRepository userRepository;

    public AnalysisResultService(AnalysisResultRepository analysisResultRepository, 
                               ExecutionRepository executionRepository,
                               UserRepository userRepository) {
        this.analysisResultRepository = analysisResultRepository;
        this.executionRepository = executionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Récupérer tous les résultats d'analyse
     */
    public List<AnalysisResult> getAllAnalysisResults() {
        return analysisResultRepository.findAll();
    }

    /**
     * Récupérer les résultats d'analyse par ID d'exécution
     */
    public List<AnalysisResult> getAnalysisResultsByExecutionId(String executionId) {
        return analysisResultRepository.findByExecutionId(executionId);
    }

    /**
     * Récupérer les résultats d'analyse par ID d'agent
     */
    public List<AnalysisResult> getAnalysisResultsByAgentId(String agentId) {
        return analysisResultRepository.findByAgentIdOrderByCreatedAtDesc(agentId);
    }

    /**
     * Récupérer les résultats d'analyse par ID d'utilisateur
     */
    public List<AnalysisResult> getAnalysisResultsByUserId(String userId) {
        return analysisResultRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Récupérer un résultat d'analyse par son ID
     */
    public Optional<AnalysisResult> getAnalysisResultById(String id) {
        return analysisResultRepository.findById(id);
    }

    /**
     * Enregistrer un nouveau résultat d'analyse pour une exécution
     */
    public Optional<AnalysisResult> saveAnalysisResult(String executionId, Map<String, Object> results) {
        System.out.println("=== Début de saveAnalysisResult ====");
        System.out.println("ExecutionId: " + executionId);
        System.out.println("Résultats reçus: " + (results != null ? results.keySet() : "null"));
        
        if (executionId == null || executionId.isEmpty()) {
            System.err.println("Erreur: ExecutionId est null ou vide");
            return Optional.empty();
        }
        
        Optional<Execution> executionOpt = executionRepository.findById(executionId);
        if (!executionOpt.isPresent()) {
            System.err.println("Erreur: Execution non trouvée pour l'ID: " + executionId);
            return Optional.empty();
        }

        Execution execution = executionOpt.get();
        System.out.println("Execution trouvée: " + execution.getId() + ", Agent: " + execution.getAgentId() + ", User: " + execution.getUserId());
        
        // Créer un nouveau résultat d'analyse
        // Le constructeur AnalysisResult va automatiquement extraire les champs structurés
        AnalysisResult analysisResult = new AnalysisResult(
            executionId,
            execution.getAgentId(),
            execution.getUserId(),
            results
        );
        System.out.println("AnalysisResult créé avec ID: " + analysisResult.getId());
        
        // Marquer l'exécution comme terminée
        execution.setStatus("TERMINÉ");
        execution.setEndTime(java.time.LocalDateTime.now());
        executionRepository.save(execution);
        System.out.println("Execution mise à jour avec statut TERMINÉ");
        
        // Mettre à jour les statistiques de l'utilisateur
        updateUserStats(execution.getUserId(), "TERMINÉ");
        System.out.println("Statistiques utilisateur mises à jour");
        
        // Sauvegarder et retourner le résultat d'analyse
        try {
            AnalysisResult savedResult = analysisResultRepository.save(analysisResult);
            System.out.println("AnalysisResult enregistré avec succès dans la base de données, ID: " + savedResult.getId());
            System.out.println("=== Fin de saveAnalysisResult ====");
            return Optional.of(savedResult);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'enregistrement du résultat d'analyse: " + e.getMessage());
            e.printStackTrace();
            throw e; // Relancer l'exception pour qu'elle soit gérée par le contrôleur
        }
    }

    /**
     * Supprimer un résultat d'analyse
     */
    public boolean deleteAnalysisResult(String id) {
        if (analysisResultRepository.existsById(id)) {
            analysisResultRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Supprimer tous les résultats d'analyse associés à une exécution
     */
    public void deleteAnalysisResultsByExecutionId(String executionId) {
        List<AnalysisResult> results = analysisResultRepository.findByExecutionId(executionId);
        analysisResultRepository.deleteAll(results);
    }

    /**
     * Supprimer tous les résultats d'analyse associés à un agent
     */
    public void deleteAnalysisResultsByAgentId(String agentId) {
        List<AnalysisResult> results = analysisResultRepository.findByAgentId(agentId);
        analysisResultRepository.deleteAll(results);
    }

    /**
     * Supprimer tous les résultats d'analyse associés à un utilisateur
     */
    public void deleteAnalysisResultsByUserId(String userId) {
        List<AnalysisResult> results = analysisResultRepository.findByUserId(userId);
        analysisResultRepository.deleteAll(results);
    }
    
    /**
     * Marquer une exécution comme échouée
     * @param executionId ID de l'exécution
     * @param errorMessage Message d'erreur
     * @return L'exécution mise à jour
     */
    public Optional<Execution> markExecutionAsFailed(String executionId, String errorMessage) {
        // Vérifier si l'exécution existe
        Optional<Execution> executionOpt = executionRepository.findById(executionId);
        if (!executionOpt.isPresent()) {
            return Optional.empty();
        }

        Execution execution = executionOpt.get();
        
        // Marquer l'exécution comme échouée
        execution.setStatus("ÉCHOUÉ");
        execution.setEndTime(java.time.LocalDateTime.now());
        execution.setNotes(errorMessage);
        
        // Mettre à jour les statistiques de l'utilisateur
        updateUserStats(execution.getUserId(), "ÉCHOUÉ");
        
        // Sauvegarder et retourner l'exécution
        return Optional.of(executionRepository.save(execution));
    }
    
    /**
     * Méthode privée pour mettre à jour les statistiques de l'utilisateur
     */
    private void updateUserStats(String userId, String executionStatus) {
        // Ne rien faire si userId est null ou vide
        if (userId == null || userId.isEmpty()) return;
        
        // Vérifier si l'utilisateur existe avant de mettre à jour ses statistiques
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            // Logger que l'utilisateur n'existe pas mais ne pas lever d'exception
            System.out.println("Utilisateur non trouvé avec l'ID: " + userId);
            return;
        }
        
        User user = userOptional.get();
        // Incrémenter le nombre total d'exécutions
        user.incrementTotalExecutions();
        
        // Mettre à jour le statut spécifique si nécessaire
        if (executionStatus != null) {
            if (executionStatus.equals("TERMINÉ")) {
                user.incrementSuccessfulExecutions();
            } else if (executionStatus.equals("ÉCHOUÉ")) {
                user.incrementFailedExecutions();
            }
        }
        
        // Sauvegarder les modifications
        userRepository.save(user);
    }
}
