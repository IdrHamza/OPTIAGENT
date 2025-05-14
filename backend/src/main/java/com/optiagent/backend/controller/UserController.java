package com.optiagent.backend.controller;

import com.optiagent.backend.model.User;
import com.optiagent.backend.model.dto.PasswordChangeRequest;
import com.optiagent.backend.model.dto.ProfileUpdateRequest;
import com.optiagent.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Integer>> getUserStats(
            @PathVariable String id,
            @RequestParam(name = "recalculate", required = false, defaultValue = "false") boolean recalculate) {
        try {
            // Récupérer l'utilisateur avec ses statistiques
            User user;
            
            if (recalculate) {
                // Forcer le recalcul des statistiques
                user = userService.calculateUserStats(id);
            } else {
                // Utiliser les statistiques existantes
                user = userService.getUserById(id);
            }
            
            Map<String, Integer> stats = new HashMap<>();
            
            // Récupérer les statistiques de l'utilisateur
            stats.put("totalAgents", user.getTotalAgents());
            stats.put("totalExecutions", user.getTotalExecutions());
            stats.put("successfulExecutions", user.getSuccessfulExecutions());
            stats.put("failedExecutions", user.getFailedExecutions());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            // En cas d'erreur, retourner des statistiques vides avec un code 200 OK
            // pour éviter les erreurs côté client
            Map<String, Integer> emptyStats = new HashMap<>();
            emptyStats.put("totalAgents", 0);
            emptyStats.put("totalExecutions", 0);
            emptyStats.put("successfulExecutions", 0);
            emptyStats.put("failedExecutions", 0);
            
            return ResponseEntity.ok(emptyStats);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }
    
    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody PasswordChangeRequest request) {
        userService.changePassword(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Mot de passe modifié avec succès");
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/account")
    public ResponseEntity<Map<String, String>> deleteAccount() {
        userService.deleteCurrentUserAccount();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Compte supprimé avec succès");
        return ResponseEntity.ok(response);
    }
}
