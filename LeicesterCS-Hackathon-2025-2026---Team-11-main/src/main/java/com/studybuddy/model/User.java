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
public class User {
    private String id;
    private String name;
    private String email;
    private String year;

    @Builder.Default
    private List<String> modules = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
