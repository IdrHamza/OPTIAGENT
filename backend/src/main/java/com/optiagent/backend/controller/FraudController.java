package com.optiagent.backend.controller;

import com.optiagent.backend.model.dto.FraudDetectionResult;
import com.optiagent.backend.service.FraudResultService;
import com.optiagent.backend.service.FraudService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Controller
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")

public class FraudController {

    public final FraudService fraudService;
    public final FraudResultService fraudResultService;

    public FraudController(FraudService fraudService,FraudResultService fraudResultService) {
        this.fraudService = fraudService;
        this.fraudResultService=fraudResultService;
    }
@PostMapping(path = "/fraud/detect",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FraudDetectionResult> detectFraud(
            @RequestParam("factures") List<MultipartFile> factures,
            @RequestParam("ordre_de_mission") MultipartFile ordreDeMission,@RequestParam("id") String agentid) {
        try {
            FraudDetectionResult result = fraudService.detectFraude(factures, ordreDeMission,agentid);
            result=fraudResultService.saveFraudResult(result,agentid);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }


}
