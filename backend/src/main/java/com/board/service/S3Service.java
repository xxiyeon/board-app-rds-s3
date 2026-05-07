package com.board.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

// AWS S3 파일 업로드/삭제를 담당하는 서비스
// S3Client는 S3Config.java에서 Bean으로 등록해서 주입받음
@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    // S3Config.java에서 만든 S3Client Bean 주입
    private final S3Client s3Client;

    // application.yml의 cloud.aws.s3.bucket 값을 읽어옴
    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    // application.yml의 cloud.aws.region.static 값을 읽어옴
    @Value("${cloud.aws.region.static}")
    private String region;

    /**
     * [핵심] S3에 파일 업로드
     * MultipartFile(브라우저에서 받은 파일)을 S3 버킷에 저장
     * @return s3Key - S3에 저장된 경로+파일명 (DB에 저장할 값)
     */
    public String upload(MultipartFile file, Long postId) throws IOException {

        // 1. 원본 파일명에서 확장자 추출 (예: ".jpg", ".pdf")
        String originalName = file.getOriginalFilename();
        String ext = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : "";

        // 2. 파일명 충돌 방지 → UUID로 고유한 파일명 생성
        //    저장 경로 예시: posts/3/550e8400-e29b-41d4-a716.jpg
        String s3Key = "posts/" + postId + "/" + UUID.randomUUID() + ext;

        // 3. S3에 업로드할 요청 객체 생성
        //    bucket: 어느 버킷에, key: 어떤 경로/이름으로 저장할지
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .contentType(file.getContentType())  // 파일 MIME 타입 (image/jpeg 등)
                .contentLength(file.getSize())        // 파일 크기 (bytes)
                .build();

        // 4. 실제 S3 업로드 실행
        s3Client.putObject(putRequest,
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        log.info("S3 업로드 완료: {}", s3Key);

        // 5. 저장된 s3Key 반환 → PostService에서 DB에 저장
        return s3Key;
    }

    /**
     * S3에서 파일 삭제
     * 게시글 삭제/수정 시 기존 파일을 S3에서도 제거
     * @param s3Key 삭제할 파일의 S3 경로+파일명
     */
    public void delete(String s3Key) {
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)  // 삭제할 파일 경로
                    .build();
            s3Client.deleteObject(deleteRequest);
            log.info("S3 삭제 완료: {}", s3Key);
        } catch (Exception e) {
            log.error("S3 삭제 실패: {}", s3Key, e);
        }
    }

    /**
     * S3 삭제 실패 시 예외를 던지는 삭제 메서드.
     * 첨부파일 개별 삭제처럼 DB 삭제와 강결합된 흐름에서 사용한다.
     */
    public void deleteOrThrow(String s3Key) {
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build();
            s3Client.deleteObject(deleteRequest);
            log.info("S3 삭제 완료: {}", s3Key);
        } catch (Exception e) {
            log.error("S3 삭제 실패: {}", s3Key, e);
            throw new RuntimeException("S3 파일 삭제에 실패했습니다.");
        }
    }

    /**
     * S3 key → 브라우저에서 접근 가능한 URL로 변환
     * 예: posts/3/uuid.jpg
     *  → https://my-bucket.s3.ap-northeast-2.amazonaws.com/posts/3/uuid.jpg
     */
    public String getFileUrl(String s3Key) {
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + s3Key;
    }
}