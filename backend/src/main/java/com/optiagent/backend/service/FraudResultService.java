package com.optiagent.backend.service;

import com.optiagent.backend.model.FraudResult;
import com.optiagent.backend.model.dto.FraudDetectionResult;
import com.optiagent.backend.model.dto.FraudResultDto;
import com.optiagent.backend.repository.FraudResultRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FraudResultService {
    
    private final FraudResultRepository fraudResultRepository;

    public FraudResultService(FraudResultRepository fraudResultRepository) {
        this.fraudResultRepository = fraudResultRepository;
    }


    public FraudDetectionResult saveFraudResult(FraudDetectionResult fraudResultlist,String agentId) {
        FraudResult fraudResult=new FraudResult();
        for (FraudResultDto fraudResultDto : fraudResultlist.getRésultats()){
            fraudResult.setFraude(fraudResultDto.getFraude());
            fraudResult.setVille(fraudResult.getVille());
            fraudResult.setAdresseComplete(fraudResult.getAdresseComplete());
            fraudResult.setRaison(fraudResultDto.getRaison());
            fraudResult.setAgentId(agentId);
            fraudResult.setMontantTotal(fraudResultDto.getMontantTotal());
            fraudResult.setDateFacture(fraudResult.getDateFacture());
            fraudResult.setNom_fichier(fraudResultDto.getNom_fichier());

            fraudResult.setNomDuCommerce(fraudResult.getNomDuCommerce());


            fraudResultRepository.save(fraudResult);
        }

        return fraudResultlist;
    }

    public List<FraudResult> getFraudResultsByAgentId(String agentId) {
        return fraudResultRepository.findByAgentId(agentId);
    }


    public List<FraudResult> getFraudulentResultsByAgentId(String agentId) {
        return fraudResultRepository.findByAgentIdAndFraude(agentId, "Oui");
    }



}
