package com.optiagent.backend.repository;

import com.optiagent.backend.model.MissionOrder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MissionOrderRepository extends MongoRepository<MissionOrder, String> {
    Optional<MissionOrder> findByAgentId(String agentId);
    
    void deleteByAgentId(String agentId);
}
