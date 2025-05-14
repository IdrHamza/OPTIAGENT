package com.optiagent.backend.repository;

import com.optiagent.backend.model.AnalysisResult;
import com.optiagent.backend.model.FraudResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudResultRepository extends MongoRepository<FraudResult, String> {
    // Find all fraud results for a specific agent
    List<FraudResult> findByAgentId(String agentId);
    
    List<FraudResult> findByAgentIdOrderByDateFactureDesc(String agentId);
    
    List<FraudResult> findByAgentIdAndFraude(String agentId, String fraude);
    
    List<FraudResult> findByAgentIdAndNomDuCommerce(String agentId, String nomDuCommerce);
}
