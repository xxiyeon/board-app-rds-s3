package com.board.dto;

import lombok.*;
import java.time.LocalDateTime;

public class CommentDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class Request {
        private String content;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String content;
        private String authorNickname;
        private String authorUsername;
        private LocalDateTime createdAt;
    }
}
