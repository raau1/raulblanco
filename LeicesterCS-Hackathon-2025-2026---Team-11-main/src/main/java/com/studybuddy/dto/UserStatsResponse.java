package com.studybuddy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {
    private Integer sessionsCreated;
    private Integer sessionsJoined;
    private Double averageRating;
    private Integer totalRatings;
}
