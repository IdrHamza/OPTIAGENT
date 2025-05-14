package com.optiagent.backend.model.dto;

import java.time.LocalDateTime;

public class InvoiceRequest {
    private String invoiceNumber;
    private String clientName;
    private double amount;
    private LocalDateTime dueDate;
    private String description;
    private String fileName;
    private String fileType;
    private byte[] fileData;

    public InvoiceRequest() {
    }

    public InvoiceRequest(String invoiceNumber, String clientName, double amount, LocalDateTime dueDate, String description) {
        this.invoiceNumber = invoiceNumber;
        this.clientName = clientName;
        this.amount = amount;
        this.dueDate = dueDate;
        this.description = description;
    }
    
    public InvoiceRequest(String invoiceNumber, String clientName, double amount, LocalDateTime dueDate, String description, String fileName, String fileType, byte[] fileData) {
        this.invoiceNumber = invoiceNumber;
        this.clientName = clientName;
        this.amount = amount;
        this.dueDate = dueDate;
        this.description = description;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileData = fileData;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
}
