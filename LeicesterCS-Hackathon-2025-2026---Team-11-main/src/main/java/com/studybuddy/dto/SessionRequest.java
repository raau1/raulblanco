package com.studybuddy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Module is required")
    private String module;

    @NotBlank(message = "Year is required")
    private String year;

    private String date;
    private String time;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer duration;

    @NotNull(message = "Max participants is required")
    @Min(value = 2, message = "At least 2 participants required")
    private Integer maxParticipants;

    private String preferences;
    private String description;
    private Boolean startNow;
}
