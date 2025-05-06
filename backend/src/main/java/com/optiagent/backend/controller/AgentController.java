package com.optiagent.backend.controller;

import com.optiagent.backend.model.Agent;
import com.optiagent.backend.model.dto.AgentDto;
import com.optiagent.backend.service.FraudDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;

@RestController
@RequestMapping("api/agent")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AgentController {
    @Autowired
    private final FraudDetectionService fraudDetectionService;

    @PostMapping("/detecter_fraude/")
    public ResponseEntity<String> detecterFraude(@RequestBody AgentDto agent) throws Exception {
       String result= fraudDetectionService.detectFraude(agent);
        byte[] fileData = new byte[0];
       Agent agentEntity=new Agent();
        for (MultipartFile file : agent.getFacture()) {
             fileData = file.getBytes();

        }
        agentEntity.setDescription(agent.getDescription());
        agentEntity.setFacture(Collections.singletonList(fileData));
        agentEntity.setOrdre_de_mission(agent.getOrdre_de_mission().getBytes());
        agentEntity.setResult(result);


       return ResponseEntity.ok(result);




    }

}
