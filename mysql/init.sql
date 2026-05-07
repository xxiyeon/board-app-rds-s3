SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

CREATE DATABASE IF NOT EXISTS boarddb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE boarddb;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    view_count INT DEFAULT 0,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(500) NOT NULL,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

DELETE FROM comments;
DELETE FROM posts;
DELETE FROM users;

ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE posts AUTO_INCREMENT = 1;
ALTER TABLE comments AUTO_INCREMENT = 1;

CREATE TABLE IF NOT EXISTS attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 테스트 데이터
INSERT INTO users (username, password, nickname, email, role) VALUES
('admin', '$2a$10$dBZH9w9eASZ.of66CaSuf.EZxIdClmPsMdEFWz7udq3tRdhfHLcdy', '관리자', 'admin@board.com', 'ADMIN'),
('user1', '$2a$10$dBZH9w9eASZ.of66CaSuf.EZxIdClmPsMdEFWz7udq3tRdhfHLcdy', '홍길동', 'user1@board.com', 'USER'),
('user2', '$2a$10$dBZH9w9eASZ.of66CaSuf.EZxIdClmPsMdEFWz7udq3tRdhfHLcdy', '김철수', 'user2@board.com', 'USER');
-- 초기 비밀번호: password123

INSERT INTO posts (title, content, user_id) VALUES
('Docker 학습 후기', 'Docker를 배우고 나니 배포가 정말 편해졌습니다. 컨테이너 개념이 처음에는 어려웠지만...', 2),
('AWS EC2 설정 방법', 'EC2 인스턴스를 생성하고 Docker를 설치하는 과정을 정리했습니다.', 3),
('Spring Boot + Docker 조합', 'Spring Boot 애플리케이션을 Docker로 컨테이너화하는 방법을 공유합니다.', 2),
('MySQL Docker 볼륨 설정', 'Docker에서 MySQL 데이터를 영구 보존하려면 볼륨 설정이 필요합니다.', 1),
('React Nginx 배포', 'React 빌드 결과물을 Nginx로 서빙하는 Dockerfile 작성법입니다.', 3);

INSERT INTO comments (content, user_id, post_id) VALUES
('정말 유익한 글이네요!', 3, 1),
('저도 같은 경험을 했습니다.', 1, 1),
('EC2 설정 관련해서 질문드려도 될까요?', 2, 2);