package com.scheduler.app.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssistantActionDto {
    private String type;
    private Map<String, Object> payload;
}
