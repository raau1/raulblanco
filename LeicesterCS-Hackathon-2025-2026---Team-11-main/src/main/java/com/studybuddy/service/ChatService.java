package com.studybuddy.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.studybuddy.dto.MessageRequest;
import com.studybuddy.dto.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private Firestore firestore;

    @Autowired
    private BlockService blockService;

    public MessageResponse sendMessage(String sessionId, MessageRequest request, String senderUid) {
        try {
            // Verify user is a participant of the session
            DocumentSnapshot sessionDoc = firestore.collection("sessions").document(sessionId).get().get();
            if (!sessionDoc.exists()) {
                throw new RuntimeException("Session not found");
            }

            List<String> participants = (List<String>) sessionDoc.get("participants");
            if (participants == null || !participants.contains(senderUid)) {
                throw new RuntimeException("You must be a participant to send messages");
            }

            // Get sender info
            DocumentSnapshot userDoc = firestore.collection("users").document(senderUid).get().get();
            String senderName = userDoc.getString("name");

            // Create message document
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("sessionId", sessionId);
            messageData.put("senderId", senderUid);
            messageData.put("senderName", senderName);
            messageData.put("content", request.getContent());
            messageData.put("timestamp", System.currentTimeMillis());

            // Store message in subcollection under session
            DocumentReference docRef = firestore.collection("sessions")
                    .document(sessionId)
                    .collection("messages")
                    .document();
            docRef.set(messageData).get();

            return mapToMessageResponse(docRef.getId(), messageData);
        } catch (Exception e) {
            throw new RuntimeException("Error sending message: " + e.getMessage());
        }
    }

    public List<MessageResponse> getMessages(String sessionId, String userUid) {
        try {
            // Verify user is a participant of the session
            DocumentSnapshot sessionDoc = firestore.collection("sessions").document(sessionId).get().get();
            if (!sessionDoc.exists()) {
                throw new RuntimeException("Session not found");
            }

            List<String> participants = (List<String>) sessionDoc.get("participants");
            if (participants == null || !participants.contains(userUid)) {
                throw new RuntimeException("You must be a participant to view messages");
            }

            // Get all blocked relations for the user
            Set<String> blockedUsers = blockService.getAllBlockedRelations(userUid);

            // Get messages ordered by timestamp
            ApiFuture<QuerySnapshot> future = firestore.collection("sessions")
                    .document(sessionId)
                    .collection("messages")
                    .orderBy("timestamp", Query.Direction.ASCENDING)
                    .get();

            List<QueryDocumentSnapshot> documents = future.get().getDocuments();

            return documents.stream()
                    .filter(doc -> !blockedUsers.contains(doc.getString("senderId")))
                    .map(doc -> mapToMessageResponse(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error getting messages: " + e.getMessage());
        }
    }

    public List<MessageResponse> getMessagesSince(String sessionId, String userUid, Long since) {
        try {
            // Verify user is a participant of the session
            DocumentSnapshot sessionDoc = firestore.collection("sessions").document(sessionId).get().get();
            if (!sessionDoc.exists()) {
                throw new RuntimeException("Session not found");
            }

            List<String> participants = (List<String>) sessionDoc.get("participants");
            if (participants == null || !participants.contains(userUid)) {
                throw new RuntimeException("You must be a participant to view messages");
            }

            // Get all blocked relations for the user
            Set<String> blockedUsers = blockService.getAllBlockedRelations(userUid);

            // Get messages after the given timestamp
            ApiFuture<QuerySnapshot> future = firestore.collection("sessions")
                    .document(sessionId)
                    .collection("messages")
                    .whereGreaterThan("timestamp", since)
                    .orderBy("timestamp", Query.Direction.ASCENDING)
                    .get();

            List<QueryDocumentSnapshot> documents = future.get().getDocuments();

            return documents.stream()
                    .filter(doc -> !blockedUsers.contains(doc.getString("senderId")))
                    .map(doc -> mapToMessageResponse(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error getting messages: " + e.getMessage());
        }
    }

    public void deleteMessage(String sessionId, String messageId, String userUid) {
        try {
            DocumentReference msgRef = firestore.collection("sessions")
                    .document(sessionId)
                    .collection("messages")
                    .document(messageId);

            DocumentSnapshot msgDoc = msgRef.get().get();
            if (!msgDoc.exists()) {
                throw new RuntimeException("Message not found");
            }

            // Only sender can delete their message
            if (!userUid.equals(msgDoc.getString("senderId"))) {
                throw new RuntimeException("You can only delete your own messages");
            }

            msgRef.delete().get();
        } catch (Exception e) {
            throw new RuntimeException("Error deleting message: " + e.getMessage());
        }
    }

    private MessageResponse mapToMessageResponse(String id, Map<String, Object> data) {
        MessageResponse response = new MessageResponse();
        response.setId(id);
        response.setSessionId((String) data.get("sessionId"));
        response.setSenderId((String) data.get("senderId"));
        response.setSenderName((String) data.get("senderName"));
        response.setContent((String) data.get("content"));
        response.setTimestamp((Long) data.get("timestamp"));

        return response;
    }
}
