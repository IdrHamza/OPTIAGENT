package com.optiagent.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "invoiceFiles")
public class InvoiceFile {
    @Id
    private String id;
    private String fileName;
    private String fileType;
    private byte[] fileData;
    private String agentId;
    private LocalDateTime uploadDate;

    public InvoiceFile() {
        this.uploadDate = LocalDateTime.now();
    }

    public InvoiceFile(String fileName, String fileType, byte[] fileData, String agentId) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileData = fileData;
        this.agentId = agentId;
        this.uploadDate = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public byte[] getFileData() {
        return fileData;
    }

    public void setFileData(byte[] fileData) {
        this.fileData = fileData;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public LocalDateTime getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(LocalDateTime uploadDate) {
        this.uploadDate = uploadDate;
    }
}
