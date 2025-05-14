package com.optiagent.backend.service;

import com.optiagent.backend.model.InvoiceFile;
import com.optiagent.backend.model.MissionOrder;
import com.optiagent.backend.repository.InvoiceFileRepository;
import com.optiagent.backend.repository.MissionOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class FileService {

    private final InvoiceFileRepository invoiceFileRepository;
    private final MissionOrderRepository missionOrderRepository;

    public FileService(InvoiceFileRepository invoiceFileRepository, MissionOrderRepository missionOrderRepository) {
        this.invoiceFileRepository = invoiceFileRepository;
        this.missionOrderRepository = missionOrderRepository;
    }

    // Méthodes pour les factures
    public InvoiceFile saveInvoiceFile(MultipartFile file, String agentId) throws IOException {
        InvoiceFile invoiceFile = new InvoiceFile(
                file.getOriginalFilename(),
                file.getContentType(),
                file.getBytes(),
                agentId
        );
        return invoiceFileRepository.save(invoiceFile);
    }

    public InvoiceFile saveInvoiceFileFromBytes(String fileName, String fileType, byte[] fileData, String agentId) {
        InvoiceFile invoiceFile = new InvoiceFile(
                fileName,
                fileType,
                fileData,
                agentId
        );
        return invoiceFileRepository.save(invoiceFile);
    }

    public List<InvoiceFile> getInvoiceFilesByAgentId(String agentId) {
        return invoiceFileRepository.findByAgentId(agentId);
    }

    public Optional<InvoiceFile> getInvoiceFileById(String id) {
        return invoiceFileRepository.findById(id);
    }

    public void deleteInvoiceFile(String id) {
        invoiceFileRepository.deleteById(id);
    }

    // Méthodes pour les ordres de mission
    public MissionOrder saveMissionOrder(MultipartFile file, String agentId) throws IOException {
        // Vérifier si un ordre de mission existe déjà pour cet agent
        Optional<MissionOrder> existingOrder = missionOrderRepository.findByAgentId(agentId);
        
        // Si un ordre existe déjà, le supprimer
        existingOrder.ifPresent(order -> missionOrderRepository.deleteById(order.getId()));
        
        // Créer et sauvegarder le nouvel ordre de mission
        MissionOrder missionOrder = new MissionOrder(
                file.getOriginalFilename(),
                file.getContentType(),
                file.getBytes(),
                agentId
        );
        return missionOrderRepository.save(missionOrder);
    }

    // Méthode pour sauvegarder un ordre de mission à partir de données binaires
    public MissionOrder saveMissionOrderFromBytes(String fileName, String fileType, byte[] fileData, String agentId, 
                                                 String missionName, String clientName, String description) {
        // Vérifier si un ordre de mission existe déjà pour cet agent
        Optional<MissionOrder> existingOrder = missionOrderRepository.findByAgentId(agentId);
        
        // Si un ordre existe déjà, le supprimer
        existingOrder.ifPresent(order -> missionOrderRepository.deleteById(order.getId()));
        
        // Créer et sauvegarder le nouvel ordre de mission
        MissionOrder missionOrder = new MissionOrder(
                fileName,
                fileType,
                fileData,
                agentId
        );
        
        // Définir les propriétés supplémentaires
        missionOrder.setMissionName(missionName);
        missionOrder.setClientName(clientName);
        missionOrder.setDescription(description);
        missionOrder.setStartDate(java.time.LocalDateTime.now());
        missionOrder.setEndDate(java.time.LocalDateTime.now().plusDays(30));
        
        return missionOrderRepository.save(missionOrder);
    }

    public Optional<MissionOrder> getMissionOrderByAgentId(String agentId) {
        return missionOrderRepository.findByAgentId(agentId);
    }

    public Optional<MissionOrder> getMissionOrderById(String id) {
        return missionOrderRepository.findById(id);
    }

    public void deleteMissionOrder(String id) {
        missionOrderRepository.deleteById(id);
    }
}
