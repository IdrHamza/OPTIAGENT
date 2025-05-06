package com.optiagent.backend.service;

import com.optiagent.backend.model.Agent;
import com.optiagent.backend.model.dto.AgentDto;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;
@Service

public class FraudDetectionService {
    private String FASTAPI_URL="http://127.0.0.1:8000/detecter_fraude/";
    RestTemplate restTemplate = new RestTemplate();
  public String detectFraude(AgentDto agentDto) {
      MultiValueMap<String,Object> body=new LinkedMultiValueMap<>();
      for(MultipartFile file : agentDto.getFacture()){
          body.add(file.getOriginalFilename(),file);


      }
      body.add(agentDto.getOrdre_de_mission().getOriginalFilename(),agentDto.getOrdre_de_mission());
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.MULTIPART_FORM_DATA);
      HttpEntity<MultiValueMap<String,Object>> entity = new HttpEntity<>(body,headers);
      return restTemplate.exchange(FASTAPI_URL,HttpMethod.POST,entity,String.class).getBody();



  }
}
