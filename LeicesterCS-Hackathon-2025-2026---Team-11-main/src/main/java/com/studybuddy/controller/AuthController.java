package com.studybuddy.controller;

import com.studybuddy.dto.AuthRequest;
import com.studybuddy.dto.AuthResponse;
import com.studybuddy.dto.SignupRequest;
import com.studybuddy.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(
            @Valid @RequestBody SignupRequest request,
            Authentication authentication) {
        // Use the UID from the authenticated token (user already created in Firebase by frontend)
        String uid = authentication.getName();
        AuthResponse response = authService.createUserProfile(uid, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
