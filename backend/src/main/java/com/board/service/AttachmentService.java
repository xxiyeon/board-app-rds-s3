package com.board.service;

import com.board.entity.Attachment;
import com.board.repository.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final S3Service s3Service;

    @Transactional
    public void deleteAttachment(Long attachmentId, String username) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("첨부파일을 찾을 수 없습니다."));

        String ownerUsername = attachment.getPost().getUser().getUsername();
        if (!ownerUsername.equals(username)) {
            throw new AccessDeniedException("본인 게시글의 첨부파일만 삭제할 수 있습니다.");
        }

        // S3 삭제가 성공한 경우에만 DB 삭제를 진행한다.
        s3Service.deleteOrThrow(attachment.getS3Key());
        attachmentRepository.delete(attachment);
    }
}
