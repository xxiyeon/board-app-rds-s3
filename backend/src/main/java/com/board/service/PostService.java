package com.board.service;

import com.board.dto.AttachmentDto;
import com.board.dto.CommentDto;
import com.board.dto.PostDto;
import com.board.entity.Attachment;
import com.board.entity.Comment;
import com.board.entity.Post;
import com.board.entity.User;
import com.board.repository.AttachmentRepository;
import com.board.repository.CommentRepository;
import com.board.repository.PostRepository;
import com.board.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final S3Service s3Service;

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "application/pdf", "application/zip",
            "application/x-zip-compressed", "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    public Page<PostDto.ListResponse> getPosts(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = (keyword != null && !keyword.isBlank())
                ? postRepository.searchByKeyword(keyword, pageable)
                : postRepository.findAllWithUser(pageable);

        return posts.map(p -> PostDto.ListResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .authorNickname(p.getUser().getNickname())
                .viewCount(p.getViewCount())
                .commentCount(p.getComments() != null ? p.getComments().size() : 0)
                .attachmentCount(p.getAttachments() != null ? p.getAttachments().size() : 0)
                .createdAt(p.getCreatedAt())
                .build());
    }

    @Transactional
    public PostDto.DetailResponse getPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        post.setViewCount(post.getViewCount() + 1);

        List<CommentDto.Response> comments = commentRepository.findByPostIdWithUser(id).stream()
                .map(c -> CommentDto.Response.builder()
                        .id(c.getId())
                        .content(c.getContent())
                        .authorNickname(c.getUser().getNickname())
                        .authorUsername(c.getUser().getUsername())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<AttachmentDto.Response> attachments = attachmentRepository.findByPostId(id).stream()
                .map(a -> AttachmentDto.Response.builder()
                        .id(a.getId())
                        .originalName(a.getOriginalName())
                        .fileUrl(a.getFileUrl())
                        .fileSize(a.getFileSize())
                        .contentType(a.getContentType())
                        .isImage(a.getContentType() != null && a.getContentType().startsWith("image/"))
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PostDto.DetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .authorNickname(post.getUser().getNickname())
                .authorUsername(post.getUser().getUsername())
                .viewCount(post.getViewCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .comments(comments)
                .attachments(attachments)
                .build();
    }

    @Transactional
    public PostDto.DetailResponse createPost(PostDto.Request request, String username,
                                             List<MultipartFile> files) throws IOException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .user(user)
                .build();
        Post saved = postRepository.save(post);

        uploadFiles(files, saved);
        return getPost(saved.getId());
    }

    @Transactional
    public PostDto.DetailResponse updatePost(Long id, PostDto.Request request, String username,
                                             List<MultipartFile> files) throws IOException {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        if (!post.getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("수정 권한이 없습니다.");
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());

        // 새 파일이 있으면 기존 파일은 유지하고 새 파일만 추가
        if (files != null && files.stream().anyMatch(f -> f != null && !f.isEmpty())) {
            uploadFiles(files, post);
        }

        return getPost(id);
    }

    @Transactional
    public void deletePost(Long id, String username) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        User user = userRepository.findByUsername(username).orElseThrow();
        if (!post.getUser().getUsername().equals(username) && !user.getRole().equals("ADMIN")) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }
        // 게시글 삭제 전 S3 파일도 삭제
        attachmentRepository.findByPostId(id).forEach(att -> s3Service.delete(att.getS3Key()));
        postRepository.delete(post);
    }

    @Transactional
    public CommentDto.Response addComment(Long postId, CommentDto.Request request, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .user(user)
                .post(post)
                .build();
        Comment saved = commentRepository.save(comment);

        return CommentDto.Response.builder()
                .id(saved.getId())
                .content(saved.getContent())
                .authorNickname(user.getNickname())
                .authorUsername(user.getUsername())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteComment(Long commentId, String username) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        User user = userRepository.findByUsername(username).orElseThrow();
        if (!comment.getUser().getUsername().equals(username) && !user.getRole().equals("ADMIN")) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }
        commentRepository.delete(comment);
    }

    private void uploadFiles(List<MultipartFile> files, Post post) throws IOException {
        if (files == null) return;
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;

            if (file.getSize() > MAX_FILE_SIZE)
                throw new RuntimeException("파일 크기는 20MB를 초과할 수 없습니다: " + file.getOriginalFilename());
            if (!ALLOWED_TYPES.contains(file.getContentType()))
                throw new RuntimeException("허용되지 않는 파일 형식입니다: " + file.getContentType());

            String s3Key = s3Service.upload(file, post.getId());
            String fileUrl = s3Service.getFileUrl(s3Key);

            attachmentRepository.save(Attachment.builder()
                    .originalName(file.getOriginalFilename())
                    .s3Key(s3Key)
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .post(post)
                    .build());
        }
    }
}
