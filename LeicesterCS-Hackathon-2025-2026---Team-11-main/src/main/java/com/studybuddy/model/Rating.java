package com.studybuddy.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Rating {
    private String id;
    private String userId;
    private String raterId;
    private String raterName;
    private Integer score;
    private String review;
    private String sessionId;
    private LocalDateTime createdAt;
}
