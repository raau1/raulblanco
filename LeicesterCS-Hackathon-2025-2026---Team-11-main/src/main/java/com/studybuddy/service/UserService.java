package com.studybuddy.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.studybuddy.dto.UserResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private Firestore firestore;

    public UserResponse getUserProfile(String uid) {
        try {
            DocumentSnapshot doc = firestore.collection("users").document(uid).get().get();
            if (!doc.exists()) {
                throw new RuntimeException("User not found");
            }
            return mapToUserResponse(uid, doc.getData());
        } catch (Exception e) {
            throw new RuntimeException("Error getting user: " + e.getMessage());
        }
    }

    public Map<String, Object> getUserStats(String uid) {
        try {
            Map<String, Object> stats = new HashMap<>();

            // Count sessions created
            QuerySnapshot createdSessions = firestore.collection("sessions")
                    .whereEqualTo("creatorId", uid)
                    .get().get();
            stats.put("sessionsCreated", createdSessions.size());

            // Count sessions joined
            QuerySnapshot joinedSessions = firestore.collection("sessions")
                    .whereArrayContains("participants", uid)
                    .get().get();
            stats.put("sessionsJoined", joinedSessions.size());

            // Get ratings
            QuerySnapshot ratings = firestore.collection("ratings")
                    .whereEqualTo("toUserId", uid)
                    .get().get();

            if (ratings.isEmpty()) {
                stats.put("averageRating", 0.0);
                stats.put("ratingCount", 0);
            } else {
                double sum = ratings.getDocuments().stream()
                        .mapToLong(doc -> doc.getLong("score"))
                        .sum();
                stats.put("averageRating", sum / ratings.size());
                stats.put("ratingCount", ratings.size());
            }

            return stats;
        } catch (Exception e) {
            throw new RuntimeException("Error getting user stats: " + e.getMessage());
        }
    }

    public void updateModules(String uid, List<String> modules) {
        try {
            firestore.collection("users").document(uid)
                    .update("modules", modules, "updatedAt", System.currentTimeMillis())
                    .get();
        } catch (Exception e) {
            throw new RuntimeException("Error updating modules: " + e.getMessage());
        }
    }

    private UserResponse mapToUserResponse(String uid, Map<String, Object> data) {
        UserResponse response = new UserResponse();
        response.setId(uid);
        response.setName((String) data.get("name"));
        response.setEmail((String) data.get("email"));
        response.setYear((String) data.get("year"));
        response.setModules((List<String>) data.get("modules"));
        return response;
    }
}
