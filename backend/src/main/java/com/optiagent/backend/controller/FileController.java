package com.optiagent.backend.controller;

import com.optiagent.backend.model.InvoiceFile;
import com.optiagent.backend.model.MissionOrder;
import com.optiagent.backend.service.FileService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:3000")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    // Endpoints pour les factures
    @PostMapping("/invoices/{agentId}")
    public ResponseEntity<?> uploadInvoiceFile(
            @PathVariable String agentId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Le fichier est vide");
            }
            
            InvoiceFile savedFile = fileService.saveInvoiceFile(file, agentId);
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedFile.getId());
            response.put("fileName", savedFile.getFileName());
            response.put("fileType", savedFile.getFileType());
            response.put("agentId", savedFile.getAgentId());
            response.put("uploadDate", savedFile.getUploadDate());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'upload de la facture: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur inattendue: " + e.getMessage());
        }
    }

    @PostMapping("/invoices")
    public ResponseEntity<?> uploadInvoiceFileWithFormData(
            @RequestParam("file") MultipartFile file,
            @RequestParam("agentId") String agentId) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Le fichier est vide");
            }
            
            InvoiceFile savedFile = fileService.saveInvoiceFile(file, agentId);
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedFile.getId());
            response.put("fileName", savedFile.getFileName());
            response.put("fileType", savedFile.getFileType());
            response.put("agentId", savedFile.getAgentId());
            response.put("uploadDate", savedFile.getUploadDate());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'upload du fichier: " + e.getMessage());
        }
    }

    @PostMapping("/invoices/base64/{agentId}")
    public ResponseEntity<?> uploadInvoiceFileBase64(
            @PathVariable String agentId,
            @RequestBody Map<String, Object> fileData) {
        try {
            if (fileData == null || !fileData.containsKey("fileData")) {
                return ResponseEntity.badRequest().body("Les données du fichier sont manquantes");
            }
            
            String base64Data = (String) fileData.get("fileData");
            String fileName = (String) fileData.getOrDefault("fileName", "invoice.pdf");
            String fileType = (String) fileData.getOrDefault("fileType", "application/pdf");
            
            // Supprimer le préfixe "data:application/pdf;base64," si présent
            if (base64Data.contains(";base64,")) {
                base64Data = base64Data.split(";base64,")[1];
            }
            
            byte[] decodedData = java.util.Base64.getDecoder().decode(base64Data);
            
            InvoiceFile savedFile = fileService.saveInvoiceFileFromBytes(fileName, fileType, decodedData, agentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedFile.getId());
            response.put("fileName", savedFile.getFileName());
            response.put("fileType", savedFile.getFileType());
            response.put("agentId", savedFile.getAgentId());
            response.put("uploadDate", savedFile.getUploadDate());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'upload de la facture: " + e.getMessage());
        }
    }

    @GetMapping("/invoices/agent/{agentId}")
    public ResponseEntity<?> getInvoiceFilesByAgentId(@PathVariable String agentId) {
        try {
            List<InvoiceFile> files = fileService.getInvoiceFilesByAgentId(agentId);
            
            List<Map<String, Object>> response = files.stream().map(file -> {
                Map<String, Object> fileInfo = new HashMap<>();
                fileInfo.put("id", file.getId());
                fileInfo.put("fileName", file.getFileName());
                fileInfo.put("fileType", file.getFileType());
                fileInfo.put("agentId", file.getAgentId());
                fileInfo.put("uploadDate", file.getUploadDate());
                return fileInfo;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des factures: " + e.getMessage());
        }
    }

    @GetMapping("/invoices/{fileId}")
    public ResponseEntity<?> downloadInvoiceFile(@PathVariable String fileId) {
        try {
            Optional<InvoiceFile> fileOptional = fileService.getInvoiceFileById(fileId);
            
            if (fileOptional.isPresent()) {
                InvoiceFile file = fileOptional.get();
                ByteArrayResource resource = new ByteArrayResource(file.getFileData());
                
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                        .contentType(MediaType.parseMediaType(file.getFileType()))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors du téléchargement de la facture: " + e.getMessage());
        }
    }

    @DeleteMapping("/invoices/{fileId}")
    public ResponseEntity<?> deleteInvoiceFile(@PathVariable String fileId) {
        try {
            fileService.deleteInvoiceFile(fileId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la suppression de la facture: " + e.getMessage());
        }
    }

    // Endpoints pour les ordres de mission
    @PostMapping("/mission-orders/{agentId}")
    public ResponseEntity<?> uploadMissionOrder(
            @PathVariable String agentId,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Le fichier est vide");
            }
            
            MissionOrder savedFile = fileService.saveMissionOrder(file, agentId);
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedFile.getId());
            response.put("fileName", savedFile.getFileName());
            response.put("fileType", savedFile.getFileType());
            response.put("agentId", savedFile.getAgentId());
            response.put("uploadDate", savedFile.getUploadDate());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'upload de l'ordre de mission: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur inattendue: " + e.getMessage());
        }
    }

    @PostMapping("/mission-orders")
    public ResponseEntity<?> uploadMissionOrderWithFormData(
            @RequestParam("file") MultipartFile file,
            @RequestParam("agentId") String agentId) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Le fichier est vide");
            }
            
            MissionOrder savedFile = fileService.saveMissionOrder(file, agentId);
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedFile.getId());
            response.put("fileName", savedFile.getFileName());
            response.put("fileType", savedFile.getFileType());
            response.put("agentId", savedFile.getAgentId());
            response.put("uploadDate", savedFile.getUploadDate());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'upload du fichier: " + e.getMessage());
        }
    }

    @PostMapping("/mission-orders/base64/{agentId}")
    public ResponseEntity<?> uploadMissionOrderBase64(
            @PathVariable String agentId,
            @RequestBody Map<String, Object> fileData) {
        try {
            if (fileData == null || !fileData.containsKey("fileData")) {
                return ResponseEntity.badRequest().body("Les données du fichier sont manquantes");
            }
            
            String base64Data = (String) fileData.get("fileData");
            String fileName = (String) fileData.getOrDefault("fileName", "mission_order.pdf");
            String fileType = (String) fileData.getOrDefault("fileType", "application/pdf");
            String missionName = (String) fileData.getOrDefault("missionName", "Mission");
            String clientName = (String) fileData.getOrDefault("clientName", "Client");
            String description = (String) fileData.getOrDefault("description", "");
            
            // Supprimer le préfixe "data:application/pdf;base64," si présent
            if (base64Data.contains(";base64,")) {
                base64Data = base64Data.split(";base64,")[1];
            }
            
            byte[] decodedData = java.util.Base64.getDecoder().decode(base64Data);
            
            MissionOrder savedFile = fileService.saveMissionOrderFromBytes(fileName, fileType, decodedData, agentId, missionName, clientName, description);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedFile.getId());
            response.put("fileName", savedFile.getFileName());
            response.put("fileType", savedFile.getFileType());
            response.put("agentId", savedFile.getAgentId());
            response.put("uploadDate", savedFile.getUploadDate());
            response.put("missionName", savedFile.getMissionName());
            response.put("clientName", savedFile.getClientName());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'upload de l'ordre de mission: " + e.getMessage());
        }
    }

    @GetMapping("/mission-orders/agent/{agentId}")
    public ResponseEntity<?> getMissionOrderByAgentId(@PathVariable String agentId) {
        try {
            Optional<MissionOrder> fileOptional = fileService.getMissionOrderByAgentId(agentId);
            
            if (fileOptional.isPresent()) {
                MissionOrder file = fileOptional.get();
                Map<String, Object> response = new HashMap<>();
                response.put("id", file.getId());
                response.put("fileName", file.getFileName());
                response.put("fileType", file.getFileType());
                response.put("agentId", file.getAgentId());
                response.put("uploadDate", file.getUploadDate());
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.ok().build();
            }
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération de l'ordre de mission: " + e.getMessage());
        }
    }

    @GetMapping("/mission-orders/{fileId}")
    public ResponseEntity<?> downloadMissionOrder(@PathVariable String fileId) {
        try {
            Optional<MissionOrder> fileOptional = fileService.getMissionOrderById(fileId);
            
            if (fileOptional.isPresent()) {
                MissionOrder file = fileOptional.get();
                ByteArrayResource resource = new ByteArrayResource(file.getFileData());
                
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                        .contentType(MediaType.parseMediaType(file.getFileType()))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors du téléchargement de l'ordre de mission: " + e.getMessage());
        }
    }

    @DeleteMapping("/mission-orders/{fileId}")
    public ResponseEntity<?> deleteMissionOrder(@PathVariable String fileId) {
        try {
            fileService.deleteMissionOrder(fileId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace(); // Ajout pour le débogage
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la suppression de l'ordre de mission: " + e.getMessage());
        }
    }
}
