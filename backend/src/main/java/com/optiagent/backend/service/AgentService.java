package com.optiagent.backend.service;

import com.optiagent.backend.model.Agent;
import com.optiagent.backend.model.Execution;
import com.optiagent.backend.model.InvoiceFile;
import com.optiagent.backend.model.MissionOrder;
import com.optiagent.backend.model.dto.AgentRequest;
import com.optiagent.backend.model.dto.InvoiceRequest;
import com.optiagent.backend.model.dto.MissionOrderRequest;
import com.optiagent.backend.repository.AgentRepository;
import com.optiagent.backend.repository.ExecutionRepository;
import com.optiagent.backend.repository.InvoiceFileRepository;
import com.optiagent.backend.repository.MissionOrderRepository;
import com.optiagent.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AgentService {

    private final AgentRepository agentRepository;
    private final InvoiceFileRepository invoiceFileRepository;
    private final MissionOrderRepository missionOrderRepository;
    private final UserRepository userRepository;
    private final ExecutionRepository executionRepository;
    private UserService userService;

    @Autowired
    public AgentService(AgentRepository agentRepository, 
                       InvoiceFileRepository invoiceFileRepository,
                       MissionOrderRepository missionOrderRepository,
                       UserRepository userRepository,
                       ExecutionRepository executionRepository,
                       @Lazy UserService userService) {
        this.agentRepository = agentRepository;
        this.invoiceFileRepository = invoiceFileRepository;
        this.missionOrderRepository = missionOrderRepository;
        this.userRepository = userRepository;
        this.executionRepository = executionRepository;
        this.userService = userService;
    }

    // Agent operations
    public List<Agent> getAllAgents() {
        return agentRepository.findAll();
    }

    public List<Agent> getAgentsByUserId(String userId) {
        return agentRepository.findByUserId(userId);
    }

    public Optional<Agent> getAgentById(String id) {
        return agentRepository.findById(id);
    }

    public Agent createAgent(AgentRequest agentRequest) {
        // Récupérer l'ID de l'utilisateur depuis la requête
        String userId = agentRequest.getUserId();

        // Créer un nouvel agent avec l'ID de l'utilisateur
        Agent agent = new Agent(agentRequest.getName(), agentRequest.getRole(), userId);

        // Mettre à jour les statistiques de l'utilisateur si l'ID est fourni
        if (userId != null && !userId.isEmpty()) {
            userRepository.findById(userId).ifPresent(user -> {
                // Incrémenter le nombre total d'agents de l'utilisateur
                user.incrementTotalAgents();
                userRepository.save(user);
            });
        }

        // Sauvegarder et retourner l'agent créé
        return agentRepository.save(agent);
    }

    public Optional<Agent> updateAgent(String id, AgentRequest agentRequest) {
        return agentRepository.findById(id)
                .map(agent -> {
                    agent.setName(agentRequest.getName());
                    agent.setRole(agentRequest.getRole());
                    
                    // Mettre à jour les statistiques utilisateur après modification
                    String userId = agent.getUserId();
                    if (userId != null && !userId.isEmpty()) {
                        try {
                            userService.calculateUserStats(userId);
                        } catch (Exception e) {
                            System.err.println("Erreur lors du recalcul des statistiques: " + e.getMessage());
                        }
                    }
                    
                    return agentRepository.save(agent);
                });
    }
    
    public boolean deleteAgent(String id) {
        return agentRepository.findById(id).map(agent -> {
            // Récupérer l'ID de l'utilisateur
            String userId = agent.getUserId();
            
            try {
                // Supprimer les exécutions associées à cet agent
                List<Execution> executions = executionRepository.findByAgentIdOrderByStartTimeDesc(id);
                executionRepository.deleteAll(executions);
                
                // Supprimer les fichiers de factures associés à cet agent
                List<InvoiceFile> invoiceFiles = invoiceFileRepository.findByAgentId(id);
                invoiceFileRepository.deleteAll(invoiceFiles);
                
                // Supprimer les ordres de mission associés à cet agent
                missionOrderRepository.deleteByAgentId(id);
                
                // Supprimer l'agent
                agentRepository.deleteById(id);
                
                // Mettre à jour les statistiques de l'utilisateur si l'agent a un propriétaire
                if (userId != null && !userId.isEmpty()) {
                    userRepository.findById(userId).ifPresent(user -> {
                        user.decrementTotalAgents();
                        userRepository.save(user);
                        
                        // Recalculer toutes les statistiques utilisateur
                        try {
                            userService.calculateUserStats(userId);
                        } catch (Exception e) {
                            System.err.println("Erreur lors du recalcul des statistiques: " + e.getMessage());
                        }
                    });
                }
            } catch (Exception e) {
                System.err.println("Erreur lors de la suppression de l'agent: " + e.getMessage());
                return false;
            }
            
            return true;
        }).orElse(false);
    }

    // Supprimer tous les agents d'un utilisateur
    public void deleteAgentsByUserId(String userId) {
        List<Agent> userAgents = agentRepository.findByUserId(userId);
        
        // Pour chaque agent, supprimer d'abord ses fichiers de factures
        for (Agent agent : userAgents) {
            List<InvoiceFile> invoiceFiles = invoiceFileRepository.findByAgentId(agent.getId());
            invoiceFileRepository.deleteAll(invoiceFiles);
        }
        
        // Puis supprimer tous les agents
        agentRepository.deleteAll(userAgents);
    }

    // Invoice File operations
    public Optional<Agent> addInvoiceToAgent(String agentId, InvoiceRequest invoiceRequest) {
        return agentRepository.findById(agentId)
                .map(agent -> {
                    // Créer un fichier de facture dans la collection invoiceFiles si des données de fichier sont fournies
                    if (invoiceRequest.getFileData() != null && invoiceRequest.getFileData().length > 0) {
                        String fileName = invoiceRequest.getFileName() != null ? 
                            invoiceRequest.getFileName() : 
                            "invoice_" + System.currentTimeMillis() + ".pdf";
                            
                        InvoiceFile invoiceFile = new InvoiceFile(
                            fileName,
                            invoiceRequest.getFileType() != null ? invoiceRequest.getFileType() : "application/pdf",
                            invoiceRequest.getFileData(),
                            agentId
                        );
                        
                        // Sauvegarder le fichier de facture
                        InvoiceFile savedInvoiceFile = invoiceFileRepository.save(invoiceFile);
                        
                        // Ajouter l'ID du fichier de facture à l'agent
                        agent.addInvoiceFileId(savedInvoiceFile.getId());
                    }
                    
                    // Sauvegarder l'agent mis à jour
                    return agentRepository.save(agent);
                });
    }

    public List<InvoiceFile> getInvoiceFilesByAgentId(String agentId) {
        return invoiceFileRepository.findByAgentId(agentId);
    }

    public Optional<InvoiceFile> getInvoiceFileById(String invoiceFileId) {
        return invoiceFileRepository.findById(invoiceFileId);
    }

    public boolean deleteInvoiceFile(String agentId, String invoiceFileId) {
        return agentRepository.findById(agentId)
                .map(agent -> {
                    boolean removed = agent.getInvoiceFileIds().remove(invoiceFileId);
                    if (removed) {
                        agentRepository.save(agent);
                        invoiceFileRepository.deleteById(invoiceFileId);
                        return true;
                    }
                    return false;
                })
                .orElse(false);
    }

    // Mission Order operations
    public Optional<Agent> addMissionOrderToAgent(String agentId, MissionOrderRequest missionOrderRequest) {
        return agentRepository.findById(agentId)
                .map(agent -> {
                    // Créer un ordre de mission dans la collection missionOrders
                    if (missionOrderRequest.getFileData() != null && missionOrderRequest.getFileData().length > 0) {
                        MissionOrder missionOrder = new MissionOrder(
                            missionOrderRequest.getFileName() != null ? missionOrderRequest.getFileName() : "mission_order_" + agent.getId() + ".pdf",
                            missionOrderRequest.getFileType() != null ? missionOrderRequest.getFileType() : "application/pdf",
                            missionOrderRequest.getFileData(),
                            agentId
                        );
                        
                        // Définir les autres propriétés de l'ordre de mission
                        missionOrder.setMissionName(missionOrderRequest.getMissionName());
                        missionOrder.setClientName(missionOrderRequest.getClientName());
                        missionOrder.setStartDate(missionOrderRequest.getStartDate());
                        missionOrder.setEndDate(missionOrderRequest.getEndDate());
                        missionOrder.setDescription(missionOrderRequest.getDescription());
                        
                        // Sauvegarder l'ordre de mission
                        MissionOrder savedMissionOrder = missionOrderRepository.save(missionOrder);
                        
                        // Associer l'ordre de mission à l'agent
                        agent.setMissionOrder(savedMissionOrder);
                    }
                    
                    // Sauvegarder l'agent mis à jour
                    return agentRepository.save(agent);
                });
    }

    public Optional<MissionOrder> getMissionOrderByAgentId(String agentId) {
        return missionOrderRepository.findByAgentId(agentId);
    }

    public boolean deleteMissionOrder(String agentId) {
        Optional<MissionOrder> missionOrderOpt = missionOrderRepository.findByAgentId(agentId);
        if (missionOrderOpt.isPresent()) {
            missionOrderRepository.delete(missionOrderOpt.get());
            return true;
        }
        return false;
    }
}
