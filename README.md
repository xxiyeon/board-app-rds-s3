# DevBoard - Docker + AWS EC2 강의 실습 프로젝트

React + Spring Boot + MySQL 풀스택 게시판 애플리케이션

---

## 🏗️ 프로젝트 구조 

```
board-app/
├── backend/                  # Spring Boot (Java 17)
│   ├── src/main/java/com/board/
│   │   ├── entity/           # JPA 엔티티
│   │   ├── repository/       # Spring Data JPA
│   │   ├── service/          # 비즈니스 로직
│   │   ├── controller/       # REST API
│   │   ├── dto/              # 요청/응답 DTO
│   │   ├── security/         # JWT 인증
│   │   └── config/           # Security, CORS 설정
│   ├── Dockerfile            # Multi-stage build
│   └── pom.xml
│
├── frontend/                 # React 18 + Vite
│   ├── src/
│   │   ├── api/              # Axios 인스턴스
│   │   ├── store/            # AuthContext (JWT 상태)
│   │   ├── components/       # Layout, PrivateRoute
│   │   └── pages/            # PostList, PostDetail, PostForm, Login, Register
│   ├── nginx.conf            # React Router + API 프록시
│   └── Dockerfile            # Multi-stage build (Node → Nginx)
│
├── mysql/
│   └── init.sql              # DB 초기화 + 샘플 데이터
│
└── docker-compose.yml        # 3-컨테이너 오케스트레이션
```

---

## 🚀 실행 방법

### 로컬 실행 (Docker Compose)

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd board-app

# 2. 전체 빌드 및 실행
docker-compose up --build

# 3. 백그라운드 실행
docker-compose up -d --build

# 접속: http://localhost
```

### AWS EC2 배포

```bash
# EC2 접속
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Docker 설치
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 프로젝트 업로드 후 실행
docker-compose up -d --build

# 접속: http://<EC2_PUBLIC_IP>
```

---

## 🔑 테스트 계정

| 아이디 | 비밀번호 | 권한 |
|--------|----------|------|
| admin | password123 | 관리자 |
| user1 | password123 | 일반 사용자 |
| user2 | password123 | 일반 사용자 |

---

## 📡 API 엔드포인트

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| POST | /api/auth/login | ❌ | 로그인 |
| POST | /api/auth/register | ❌ | 회원가입 |
| GET | /api/posts | ❌ | 게시글 목록 (페이징, 검색) |
| GET | /api/posts/{id} | ❌ | 게시글 상세 |
| POST | /api/posts | ✅ | 게시글 작성 |
| PUT | /api/posts/{id} | ✅ | 게시글 수정 (작성자) |
| DELETE | /api/posts/{id} | ✅ | 게시글 삭제 (작성자/관리자) |
| POST | /api/posts/{id}/comments | ✅ | 댓글 작성 |
| DELETE | /api/posts/comments/{id} | ✅ | 댓글 삭제 (작성자/관리자) |

---

## 🐳 Docker 명령어 모음

```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# 컨테이너 재시작
docker-compose restart backend

# 전체 중지 및 삭제
docker-compose down

# 볼륨까지 삭제 (DB 초기화)
docker-compose down -v

# 이미지 재빌드
docker-compose build --no-cache
```

---

## 🏛️ 아키텍처

```
브라우저
   │
   ▼
[Nginx :80]  ──── 정적파일(React 빌드)
   │
   │ /api/* 프록시
   ▼
[Spring Boot :8080]  ──── JWT 인증
   │
   │ JPA / JDBC
   ▼
[MySQL :3306]  ──── board-mysql-data (볼륨)
```

모든 컨테이너는 `board-network` 브리지 네트워크로 통신합니다.
#
