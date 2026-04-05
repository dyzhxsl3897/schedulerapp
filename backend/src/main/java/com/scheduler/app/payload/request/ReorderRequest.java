package com.scheduler.app.payload.request;

import lombok.Data;

import java.util.UUID;

@Data
public class ReorderRequest {
    private UUID id;
    private Integer sortOrder;
}
