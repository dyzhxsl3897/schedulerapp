package com.scheduler.app.service;

import com.scheduler.app.payload.request.ChatRequest;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class AiChatService {

    private static final Logger logger = LoggerFactory.getLogger(AiChatService.class);

    @Value("${ai.system-prompt-resource}")
    private Resource systemPromptResource;

    private String systemPrompt;

    @PostConstruct
    private void loadSystemPrompt() throws java.io.IOException {
        systemPrompt = StreamUtils.copyToString(systemPromptResource.getInputStream(), StandardCharsets.UTF_8).trim();
    }

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.api.model}")
    private String model;

    @Value("${ai.api.max-tokens}")
    private int maxTokens;

    private final RestTemplate restTemplate = new RestTemplate();

    public String chat(ChatRequest request, UUID userId) {
        try {
            List<Map<String, String>> messages = buildMessages(request);

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("messages", messages);
            body.put("max_tokens", maxTokens);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (apiKey != null && !apiKey.isBlank()) {
                headers.setBearerAuth(apiKey);
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, entity, Map.class);

            return extractReply(response.getBody());
        } catch (Exception e) {
            logger.error("AI chat request failed: {}", e.getMessage(), e);
            return "Sorry, I'm unable to respond right now. Please check that the AI service is configured and running.";
        }
    }

    private List<Map<String, String>> buildMessages(ChatRequest request) {
        List<Map<String, String>> messages = new ArrayList<>();

        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (request.getHistory() != null) {
            for (ChatRequest.ChatMessageDto msg : request.getHistory()) {
                messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
            }
        }

        messages.add(Map.of("role", "user", "content", request.getMessage()));

        return messages;
    }

    @SuppressWarnings("unchecked")
    private String extractReply(Map<String, Object> responseBody) {
        if (responseBody == null) {
            return "No response received from AI service.";
        }

        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        if (choices == null || choices.isEmpty()) {
            return "No response received from AI service.";
        }

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        if (message == null) {
            return "No response received from AI service.";
        }

        return (String) message.get("content");
    }
}
