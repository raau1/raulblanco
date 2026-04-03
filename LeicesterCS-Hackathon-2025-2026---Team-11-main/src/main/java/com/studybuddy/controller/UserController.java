package com.studybuddy.controller;

import com.studybuddy.dto.RatingRequest;
import com.studybuddy.dto.UserResponse;
import com.studybuddy.service.BlockService;
import com.studybuddy.service.RatingService;
import com.studybuddy.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private RatingService ratingService;

    @Autowired
    private BlockService blockService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        UserResponse user = userService.getUserProfile(authentication.getName());
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me/stats")
    public ResponseEntity<Map<String, Object>> getCurrentUserStats(Authentication authentication) {
        Map<String, Object> stats = userService.getUserStats(authentication.getName());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        UserResponse user = userService.getUserProfile(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me/modules")
    public ResponseEntity<Map<String, String>> updateModules(
            @RequestBody List<String> modules,
            Authentication authentication) {
        userService.updateModules(authentication.getName(), modules);
        return ResponseEntity.ok(Map.of("message", "Modules updated"));
    }

    @PostMapping("/{id}/rate")
    public ResponseEntity<Map<String, Object>> rateUser(
            @PathVariable String id,
            @Valid @RequestBody RatingRequest request,
            Authentication authentication) {
        Map<String, Object> stats = ratingService.rateUser(authentication.getName(), id, request);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}/rating")
    public ResponseEntity<Map<String, Object>> getUserRating(@PathVariable String id) {
        Map<String, Object> stats = ratingService.getUserRatingStats(id);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}/my-rating")
    public ResponseEntity<Map<String, Object>> getMyRatingForUser(
            @PathVariable String id,
            Authentication authentication) {
        Map<String, Object> rating = ratingService.getMyRatingForUser(authentication.getName(), id);
        if (rating == null) {
            return ResponseEntity.ok(Map.of("hasRated", false));
        }
        rating.put("hasRated", true);
        return ResponseEntity.ok(rating);
    }

    @PostMapping("/{id}/block")
    public ResponseEntity<Map<String, String>> blockUser(
            @PathVariable String id,
            Authentication authentication) {
        blockService.blockUser(authentication.getName(), id);
        return ResponseEntity.ok(Map.of("message", "User blocked successfully"));
    }

    @DeleteMapping("/{id}/block")
    public ResponseEntity<Map<String, String>> unblockUser(
            @PathVariable String id,
            Authentication authentication) {
        blockService.unblockUser(authentication.getName(), id);
        return ResponseEntity.ok(Map.of("message", "User unblocked successfully"));
    }

    @GetMapping("/{id}/block-status")
    public ResponseEntity<Map<String, Object>> getBlockStatus(
            @PathVariable String id,
            Authentication authentication) {
        boolean hasBlocked = blockService.hasBlocked(authentication.getName(), id);
        boolean isBlockedBy = blockService.hasBlocked(id, authentication.getName());
        return ResponseEntity.ok(Map.of(
                "hasBlocked", hasBlocked,
                "isBlockedBy", isBlockedBy
        ));
    }

    @GetMapping("/blocked")
    public ResponseEntity<List<String>> getBlockedUsers(Authentication authentication) {
        List<String> blockedUsers = blockService.getBlockedUsers(authentication.getName());
        return ResponseEntity.ok(blockedUsers);
    }

    @GetMapping("/blocked/details")
    public ResponseEntity<List<UserResponse>> getBlockedUsersDetails(Authentication authentication) {
        List<String> blockedUserIds = blockService.getBlockedUsers(authentication.getName());
        List<UserResponse> blockedUsers = blockedUserIds.stream()
                .map(userId -> {
                    try {
                        return userService.getUserProfile(userId);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(user -> user != null)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(blockedUsers);
    }
}
