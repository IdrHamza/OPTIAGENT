package com.optiagent.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor

public class FraudDetectionResult {
    private List<FraudResultDto> résultats;

}
