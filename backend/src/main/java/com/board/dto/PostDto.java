package com.board.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class PostDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {
        private String title;
        private String content;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ListResponse {
        private Long id;
        private String title;
        private String authorNickname;
        private Integer viewCount;
        private int commentCount;
        private int attachmentCount;
        private LocalDateTime createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DetailResponse {
        private Long id;
        private String title;
        private String content;
        private String authorNickname;
        private String authorUsername;
        private Integer viewCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<CommentDto.Response> comments;
        private List<AttachmentDto.Response> attachments;
    }
}
