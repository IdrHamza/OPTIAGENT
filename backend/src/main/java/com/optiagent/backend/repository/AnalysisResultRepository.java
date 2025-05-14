package com.optiagent.backend.repository;

import com.optiagent.backend.model.AnalysisResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisResultRepository extends MongoRepository<AnalysisResult, String> {
    List<AnalysisResult> findByExecutionId(String executionId);
    List<AnalysisResult> findByAgentId(String agentId);
    List<AnalysisResult> findByUserId(String userId);
    List<AnalysisResult> findByAgentIdOrderByCreatedAtDesc(String agentId);
    List<AnalysisResult> findByUserIdOrderByCreatedAtDesc(String userId);
}
