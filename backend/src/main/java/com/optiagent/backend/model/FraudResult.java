package com.optiagent.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
@NoArgsConstructor
@Data
@AllArgsConstructor

@Document(collection = "FraudResult")
public class FraudResult {
    @Id
    private String id;
    private String agentId;
    private String nom_fichier;
    private String nomDuCommerce;
    private String dateFacture;
    private Double montantTotal;
    private String ville;
    private String adresseComplete;
    private String fraude;
    private List<String> raison;
}
