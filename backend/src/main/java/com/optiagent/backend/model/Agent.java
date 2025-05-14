package com.optiagent.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "agents")
public class Agent {
    @Id
    private String id;
    private String name;
    private String role;
    private LocalDateTime createdAt;
    private List<String> invoiceFileIds = new ArrayList<>(); // IDs des fichiers de factures
    private MissionOrder missionOrder;
    private String userId; // ID de l'utilisateur propriétaire

    public Agent() {
        this.createdAt = LocalDateTime.now();
    }

    public Agent(String name, String role, String userId) {
        this.name = name;
        this.role = role;
        this.userId = userId;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<String> getInvoiceFileIds() {
        return invoiceFileIds;
    }

    public void setInvoiceFileIds(List<String> invoiceFileIds) {
        this.invoiceFileIds = invoiceFileIds;
    }

    public void addInvoiceFileId(String invoiceFileId) {
        this.invoiceFileIds.add(invoiceFileId);
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public MissionOrder getMissionOrder() {
        return missionOrder;
    }

    public void setMissionOrder(MissionOrder missionOrder) {
        this.missionOrder = missionOrder;
    }
}
