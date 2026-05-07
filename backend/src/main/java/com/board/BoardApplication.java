package com.board;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BoardApplication {
    public static void main(String[] args) {
        var ctx = SpringApplication.run(BoardApplication.class, args);

        // 임시: 올바른 BCrypt 해시 출력
        var encoder = ctx.getBean(org.springframework.security.crypto.password.PasswordEncoder.class);
        System.out.println("=== BCrypt 해시 ===");
        System.out.println(encoder.encode("password123"));
        System.out.println("==================");
    }
}