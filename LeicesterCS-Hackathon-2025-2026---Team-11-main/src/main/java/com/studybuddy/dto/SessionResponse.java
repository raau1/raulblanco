package com.studybuddy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private String id;
    private String title;
    private String module;
    private String year;
    private String date;
    private String time;
    private Integer duration;
    private Integer maxParticipants;
    private List<String> preferences;
    private String description;
    private Boolean isLive;
    private Boolean isScheduled;
    private Long scheduledStartTime;
    private String status;
    private String creatorId;
    private String creatorName;
    private Boolean startNow;
    private List<String> participants;
    private List<String> joinRequests;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private Integer participantCount;
    private Integer spotsLeft;
    private Double creatorRating;
    private Integer creatorRatingCount;
}
