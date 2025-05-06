package com.optiagent.backend.repository;

import com.optiagent.backend.model.Agent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgentRepository extends MongoRepository<Agent, String> {
    // You can add custom query methods here if needed
}
