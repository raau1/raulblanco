package com.studybuddy.service;

import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class BlockService {

    @Autowired
    private Firestore firestore;

    /**
     * Block a user
     */
    public void blockUser(String blockerId, String blockedId) {
        try {
            // Can't block yourself
            if (blockerId.equals(blockedId)) {
                throw new RuntimeException("You cannot block yourself");
            }

            // Check if already blocked
            QuerySnapshot existing = firestore.collection("blocks")
                    .whereEqualTo("blockerId", blockerId)
                    .whereEqualTo("blockedId", blockedId)
                    .get().get();

            if (!existing.isEmpty()) {
                throw new RuntimeException("User is already blocked");
            }

            // Create block record
            Map<String, Object> blockData = new HashMap<>();
            blockData.put("blockerId", blockerId);
            blockData.put("blockedId", blockedId);
            blockData.put("createdAt", System.currentTimeMillis());

            firestore.collection("blocks").document().set(blockData).get();
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Unblock a user
     */
    public void unblockUser(String blockerId, String blockedId) {
        try {
            QuerySnapshot snapshot = firestore.collection("blocks")
                    .whereEqualTo("blockerId", blockerId)
                    .whereEqualTo("blockedId", blockedId)
                    .get().get();

            if (snapshot.isEmpty()) {
                throw new RuntimeException("User is not blocked");
            }

            // Delete the block record
            for (DocumentSnapshot doc : snapshot.getDocuments()) {
                doc.getReference().delete().get();
            }
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Check if user A has blocked user B
     */
    public boolean hasBlocked(String blockerId, String blockedId) {
        try {
            QuerySnapshot snapshot = firestore.collection("blocks")
                    .whereEqualTo("blockerId", blockerId)
                    .whereEqualTo("blockedId", blockedId)
                    .get().get();

            return !snapshot.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Check if either user has blocked the other (bidirectional check)
     */
    public boolean isBlocked(String userId1, String userId2) {
        return hasBlocked(userId1, userId2) || hasBlocked(userId2, userId1);
    }

    /**
     * Get list of user IDs blocked by the given user
     */
    public List<String> getBlockedUsers(String userId) {
        try {
            QuerySnapshot snapshot = firestore.collection("blocks")
                    .whereEqualTo("blockerId", userId)
                    .get().get();

            return snapshot.getDocuments().stream()
                    .map(doc -> doc.getString("blockedId"))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * Get list of user IDs who have blocked the given user
     */
    public List<String> getBlockedByUsers(String userId) {
        try {
            QuerySnapshot snapshot = firestore.collection("blocks")
                    .whereEqualTo("blockedId", userId)
                    .get().get();

            return snapshot.getDocuments().stream()
                    .map(doc -> doc.getString("blockerId"))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * Get all users that should be filtered out (both directions)
     */
    public Set<String> getAllBlockedRelations(String userId) {
        Set<String> blocked = new HashSet<>();
        blocked.addAll(getBlockedUsers(userId));
        blocked.addAll(getBlockedByUsers(userId));
        return blocked;
    }
}
