package com.scheduler.app.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ChildResponse {
    private UUID id;
    private String username;
    private LocalDateTime createdAt;
}