package com.optiagent.backend.service;

import com.optiagent.backend.model.FraudResult;
import com.optiagent.backend.model.dto.FraudDetectionResult;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class FraudService {
    private String FASTAPI_URL="http://127.0.0.1:8000/detecter_fraude/";
    private FraudResult fraudresultentity;


    RestTemplate restTemplate=new RestTemplate();
    public FraudService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public FraudDetectionResult detectFraude(List<MultipartFile> factures, MultipartFile ordreDeMission,String id) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        // Convert factures to resources
        for (MultipartFile file : factures) {
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename(); // Required by FastAPI
                }
            };
            body.add("factures", resource);
        }

        // Convert ordre de mission to resource
        ByteArrayResource ordreResource = new ByteArrayResource(ordreDeMission.getBytes()) {
            @Override
            public String getFilename() {
                return ordreDeMission.getOriginalFilename(); // Required by FastAPI
            }
        };
        body.add("ordre_mission", ordreResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<FraudDetectionResult> response = restTemplate.exchange(
                FASTAPI_URL,
                HttpMethod.POST,
                requestEntity,
                FraudDetectionResult.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("FastAPI returned status: " + response.getStatusCode());
        }


        return response.getBody();
    }


}
