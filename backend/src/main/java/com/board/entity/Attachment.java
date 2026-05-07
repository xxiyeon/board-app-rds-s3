package com.board.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attachments")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 화면에 보여줄 원본 파일명
    @Column(name = "original_name", nullable = false)
    private String originalName;

    // S3에 저장된 키 (경로 포함)
    @Column(name = "s3_key", nullable = false)
    private String s3Key;

    // S3 접근 URL
    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    // 파일 크기 (bytes)
    @Column(name = "file_size")
    private Long fileSize;

    // MIME 타입 (image/jpeg, application/pdf 등)
    @Column(name = "content_type", length = 100)
    private String contentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
