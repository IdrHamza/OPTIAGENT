package com.optiagent.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
@NoArgsConstructor
@AllArgsConstructor
@Data
public class AgentDto {

    private List<MultipartFile> facture;
    private MultipartFile ordre_de_mission;
    private String description;
    private String result;
}
