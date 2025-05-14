package com.optiagent.backend.repository;

import com.optiagent.backend.model.InvoiceFile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceFileRepository extends MongoRepository<InvoiceFile, String> {
    List<InvoiceFile> findByAgentId(String agentId);
}
