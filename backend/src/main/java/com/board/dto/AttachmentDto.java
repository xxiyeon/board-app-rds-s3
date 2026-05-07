package com.board.dto;

import lombok.*;
import java.time.LocalDateTime;

public class AttachmentDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String originalName;
        private String fileUrl;
        private Long fileSize;
        private String contentType;
        private boolean isImage;
        private LocalDateTime createdAt;
    }
}
