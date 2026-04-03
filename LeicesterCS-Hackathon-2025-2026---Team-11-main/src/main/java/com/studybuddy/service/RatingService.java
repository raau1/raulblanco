package com.studybuddy.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.studybuddy.dto.RatingRequest;
import com.studybuddy.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RatingService {

    @Autowired
    private Firestore firestore;

    public Map<String, Object> rateUser(String fromUserId, String toUserId, RatingRequest request) {
        try {
            // Can't rate yourself
            if (fromUserId.equals(toUserId)) {
                throw new BadRequestException("You cannot rate yourself");
            }

            // Check if user has already rated this person
            QuerySnapshot existing = firestore.collection("ratings")
                    .whereEqualTo("fromUserId", fromUserId)
                    .whereEqualTo("toUserId", toUserId)
                    .get().get();

            String ratingId;
            Map<String, Object> ratingData = new HashMap<>();
            ratingData.put("fromUserId", fromUserId);
            ratingData.put("toUserId", toUserId);
            ratingData.put("score", request.getScore());
            ratingData.put("comment", request.getComment());
            ratingData.put("timestamp", System.currentTimeMillis());

            if (!existing.isEmpty()) {
                // Update existing rating
                ratingId = existing.getDocuments().get(0).getId();
                firestore.collection("ratings").document(ratingId).set(ratingData).get();
            } else {
                // Create new rating
                ratingId = firestore.collection("ratings").document().getId();
                firestore.collection("ratings").document(ratingId).set(ratingData).get();
            }

            // Return updated rating stats for the user
            return getUserRatingStats(toUserId);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error rating user: " + e.getMessage());
        }
    }

    public Map<String, Object> getUserRatingStats(String userId) {
        try {
            Map<String, Object> stats = new HashMap<>();

            QuerySnapshot ratings = firestore.collection("ratings")
                    .whereEqualTo("toUserId", userId)
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
            throw new RuntimeException("Error getting rating stats: " + e.getMessage());
        }
    }

    public Map<String, Object> getMyRatingForUser(String fromUserId, String toUserId) {
        try {
            QuerySnapshot existing = firestore.collection("ratings")
                    .whereEqualTo("fromUserId", fromUserId)
                    .whereEqualTo("toUserId", toUserId)
                    .get().get();

            if (existing.isEmpty()) {
                return null;
            }

            DocumentSnapshot doc = existing.getDocuments().get(0);
            Map<String, Object> rating = new HashMap<>();
            rating.put("score", doc.getLong("score"));
            rating.put("comment", doc.getString("comment"));
            return rating;
        } catch (Exception e) {
            throw new RuntimeException("Error getting rating: " + e.getMessage());
        }
    }
}
