package com.optiagent.backend.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor

public class FraudResultDto {
    private String nom_fichier;
    @JsonProperty("Nom du commerce")
    private String nomDuCommerce;
    @JsonProperty("Date de la facture")
    private String dateFacture;
    @JsonProperty("Montant total")
    private Double montantTotal;
    @JsonProperty("Ville")
    private String ville;
    @JsonProperty("Adresse complète")
    private String adresseComplete;
    private String fraude;
    private List<String> raison;

}
