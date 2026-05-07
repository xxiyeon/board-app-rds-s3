package com.board.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

// ===== Auth DTOs =====
public class AuthDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegisterRequest {
        private String username;
        private String password;
        private String nickname;
        private String email;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthResponse {
        private String token;
        private String username;
        private String nickname;
        private String role;
    }
}
