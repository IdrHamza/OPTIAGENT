package com.optiagent.backend.model.dto;

import java.time.LocalDateTime;

public class MissionOrderRequest {
    private String missionName;
    private String clientName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String description;
    private String fileName;
    private String fileType;
    private byte[] fileData;

    public MissionOrderRequest() {
    }

    public MissionOrderRequest(String missionName, String clientName, LocalDateTime startDate, LocalDateTime endDate, String description) {
        this.missionName = missionName;
        this.clientName = clientName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.description = description;
    }
    
    public MissionOrderRequest(String missionName, String clientName, LocalDateTime startDate, LocalDateTime endDate, String description, String fileName, String fileType, byte[] fileData) {
        this.missionName = missionName;
        this.clientName = clientName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.description = description;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileData = fileData;
    }

    public String getMissionName() {
        return missionName;
    }

    public void setMissionName(String missionName) {
        this.missionName = missionName;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
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
