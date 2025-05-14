package com.optiagent.backend.controller;

import com.optiagent.backend.model.Agent;
import com.optiagent.backend.model.InvoiceFile;
import com.optiagent.backend.model.MissionOrder;
import com.optiagent.backend.model.dto.AgentRequest;
import com.optiagent.backend.model.dto.InvoiceRequest;
import com.optiagent.backend.model.dto.MissionOrderRequest;
import com.optiagent.backend.service.AgentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/agents")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    // Agent endpoints
    @GetMapping
    public ResponseEntity<List<Agent>> getAllAgents() {
        return ResponseEntity.ok(agentService.getAllAgents());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Agent>> getAgentsByUserId(@PathVariable String userId) {
        try {
            List<Agent> agents = agentService.getAgentsByUserId(userId);
            return ResponseEntity.ok(agents);
        } catch (Exception e) {
            // En cas d'erreur, retourner une liste vide avec un code 200 OK
            // pour éviter les erreurs côté client
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Agent> getAgentById(@PathVariable String id) {
        return agentService.getAgentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Agent> createAgent(@RequestBody AgentRequest agentRequest) {
        Agent createdAgent = agentService.createAgent(agentRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAgent);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Agent> updateAgent(@PathVariable String id, @RequestBody AgentRequest agentRequest) {
        return agentService.updateAgent(id, agentRequest)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAgent(@PathVariable String id) {
        if (agentService.deleteAgent(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Invoice File endpoints
    @GetMapping("/{agentId}/invoices")
    public ResponseEntity<List<InvoiceFile>> getInvoiceFilesByAgentId(@PathVariable String agentId) {
        if (!agentService.getAgentById(agentId).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(agentService.getInvoiceFilesByAgentId(agentId));
    }

    @PostMapping("/{agentId}/invoices")
    public ResponseEntity<Agent> addInvoiceToAgent(
            @PathVariable String agentId,
            @RequestBody InvoiceRequest invoiceRequest) {
        return agentService.addInvoiceToAgent(agentId, invoiceRequest)
                .map(agent -> ResponseEntity.status(HttpStatus.CREATED).body(agent))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/invoices/{invoiceFileId}")
    public ResponseEntity<InvoiceFile> getInvoiceFileById(@PathVariable String invoiceFileId) {
        return agentService.getInvoiceFileById(invoiceFileId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{agentId}/invoices/{invoiceFileId}")
    public ResponseEntity<Void> deleteInvoiceFile(
            @PathVariable String agentId,
            @PathVariable String invoiceFileId) {
        if (agentService.deleteInvoiceFile(agentId, invoiceFileId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Mission Order endpoints
    @GetMapping("/{agentId}/mission-order")
    public ResponseEntity<MissionOrder> getMissionOrderByAgentId(@PathVariable String agentId) {
        if (!agentService.getAgentById(agentId).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        return agentService.getMissionOrderByAgentId(agentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{agentId}/mission-order")
    public ResponseEntity<Agent> addMissionOrderToAgent(
            @PathVariable String agentId,
            @RequestBody MissionOrderRequest missionOrderRequest) {
        return agentService.addMissionOrderToAgent(agentId, missionOrderRequest)
                .map(agent -> ResponseEntity.status(HttpStatus.CREATED).body(agent))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{agentId}/mission-order")
    public ResponseEntity<Void> deleteMissionOrder(@PathVariable String agentId) {
        if (agentService.deleteMissionOrder(agentId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
