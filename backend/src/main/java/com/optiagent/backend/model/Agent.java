package com.optiagent.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Document(collection = "agents")  // MongoDB collection name
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Agent {

    @Id
    private String id;

    private List<byte[]> facture;
    private byte[] ordre_de_mission;
    private String description;
    private String result;
}
