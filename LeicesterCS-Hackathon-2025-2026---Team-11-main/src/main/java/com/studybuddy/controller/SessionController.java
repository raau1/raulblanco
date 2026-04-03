package com.studybuddy.controller;

import com.studybuddy.dto.SessionRequest;
import com.studybuddy.dto.SessionResponse;
import com.studybuddy.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @GetMapping
    public ResponseEntity<List<SessionResponse>> getAllSessions(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String module) {
        List<SessionResponse> sessions = sessionService.getAllSessions(year, module);
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable String id) {
        SessionResponse session = sessionService.getSessionById(id);
        return ResponseEntity.ok(session);
    }

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(
            @Valid @RequestBody SessionRequest request,
            Authentication authentication) {
        // authentication.getName() returns the Firebase UID
        SessionResponse session = sessionService.createSession(request, authentication.getName());
        return ResponseEntity.ok(session);
    }

    @GetMapping("/my-sessions")
    public ResponseEntity<List<SessionResponse>> getMySessions(Authentication authentication) {
        List<SessionResponse> sessions = sessionService.getSessionsByCreator(authentication.getName());
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/joined")
    public ResponseEntity<List<SessionResponse>> getJoinedSessions(Authentication authentication) {
        List<SessionResponse> sessions = sessionService.getSessionsJoined(authentication.getName());
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/{id}/request")
    public ResponseEntity<Map<String, String>> requestToJoin(
            @PathVariable String id,
            Authentication authentication) {
        sessionService.requestToJoin(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Join request sent"));
    }

    @PostMapping("/{id}/accept/{userId}")
    public ResponseEntity<Map<String, String>> acceptRequest(
            @PathVariable String id,
            @PathVariable String userId,
            Authentication authentication) {
        sessionService.acceptRequest(id, userId, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Request accepted"));
    }

    @PostMapping("/{id}/decline/{userId}")
    public ResponseEntity<Map<String, String>> declineRequest(
            @PathVariable String id,
            @PathVariable String userId,
            Authentication authentication) {
        sessionService.declineRequest(id, userId, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Request declined"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteSession(
            @PathVariable String id,
            Authentication authentication) {
        sessionService.deleteSession(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Session deleted"));
    }

    @PostMapping("/{id}/kick/{userId}")
    public ResponseEntity<Map<String, String>> kickParticipant(
            @PathVariable String id,
            @PathVariable String userId,
            Authentication authentication) {
        sessionService.kickParticipant(id, userId, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "User kicked from session"));
    }
}
