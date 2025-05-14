package com.optiagent.backend.repository;

import com.optiagent.backend.model.Execution;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExecutionRepository extends MongoRepository<Execution, String> {
    List<Execution> findByAgentId(String agentId);
    List<Execution> findByAgentIdOrderByStartTimeDesc(String agentId);
    List<Execution> findByUserId(String userId);
    List<Execution> findByUserIdOrderByStartTimeDesc(String userId);
}
