package com.studybuddy.controller;

import com.studybuddy.dto.MessageRequest;
import com.studybuddy.dto.MessageResponse;
import com.studybuddy.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions/{sessionId}/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable String sessionId,
            @Valid @RequestBody MessageRequest request,
            Authentication authentication) {
        String uid = authentication.getName();
        MessageResponse response = chatService.sendMessage(sessionId, request, uid);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable String sessionId,
            @RequestParam(required = false) Long since,
            Authentication authentication) {
        String uid = authentication.getName();
        List<MessageResponse> messages;

        if (since != null) {
            messages = chatService.getMessagesSince(sessionId, uid, since);
        } else {
            messages = chatService.getMessages(sessionId, uid);
        }

        return ResponseEntity.ok(messages);
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String sessionId,
            @PathVariable String messageId,
            Authentication authentication) {
        String uid = authentication.getName();
        chatService.deleteMessage(sessionId, messageId, uid);
        return ResponseEntity.ok().build();
    }
}
