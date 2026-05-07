# ===== Stage 1: Build =====
FROM node:20-alpine AS builder

WORKDIR /app

# package 파일 먼저 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# ===== Stage 2: Nginx =====
FROM nginx:alpine

# 기본 nginx 설정 삭제 후 커스텀 설정 복사
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]