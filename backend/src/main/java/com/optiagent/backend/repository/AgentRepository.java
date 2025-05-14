package com.optiagent.backend.repository;

import com.optiagent.backend.model.Agent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentRepository extends MongoRepository<Agent, String> {
    List<Agent> findByNameContainingIgnoreCase(String name);
    Optional<Agent> findByName(String name);
    List<Agent> findByUserId(String userId);
}
