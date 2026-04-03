package com.studybuddy.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Session {
    private String id;
    private String title;
    private String module;
    private String year;
    private String date;
    private String time;
    private Integer duration;
    private Integer maxParticipants;
    private String preferences;
    private String description;
    private String creatorId;
    private String creatorName;
    private Boolean startNow;

    @Builder.Default
    private List<String> participants = new ArrayList<>();

    @Builder.Default
    private List<String> joinRequests = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
