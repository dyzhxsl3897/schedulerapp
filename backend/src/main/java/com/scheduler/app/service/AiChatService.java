package com.scheduler.app.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scheduler.app.payload.request.ChatRequest;
import com.scheduler.app.payload.response.AssistantActionDto;
import com.scheduler.app.payload.response.ChatResponse;
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
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiChatService {

    private static final Logger logger = LoggerFactory.getLogger(AiChatService.class);

    private static final Set<String> ALLOWED_ACTION_TYPES = Set.of("create_activity", "create_event");

    // Matches a fenced ```action ... ``` block (case-insensitive on the tag).
    // Example match (everything between the fences, group(1) is the JSON body):
    //
    //   Sure, I'll create that activity for you.
    //   ```action
    //   {
    //     "type": "create_activity",
    //     "payload": { "title": "Read paper", "priority": "HIGH" }
    //   }
    //   ```
    //
    // group(1) would be:
    //   {
    //     "type": "create_activity",
    //     "payload": { "title": "Read paper", "priority": "HIGH" }
    //   }
    private static final Pattern ACTION_BLOCK_PATTERN = Pattern.compile(
            "```\\s*action\\s*\\r?\\n([\\s\\S]*?)```",
            Pattern.CASE_INSENSITIVE);

    private final ObjectMapper objectMapper = new ObjectMapper();

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

    public ChatResponse chat(ChatRequest request, UUID userId) {
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

            String rawReply = extractReply(response.getBody());
            return parseReply(rawReply);
        } catch (Exception e) {
            logger.error("AI chat request failed: {}", e.getMessage(), e);
            return new ChatResponse("Sorry, I'm unable to respond right now. Please check that the AI service is configured and running.");
        }
    }

    private List<Map<String, String>> buildMessages(ChatRequest request) {
        List<Map<String, String>> messages = new ArrayList<>();

        String prompt = systemPrompt + "\n\nToday is " + LocalDate.now() + ".";
        messages.add(Map.of("role", "system", "content", prompt));

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

    /**
     * Parses an LLM reply, extracting any trailing ```action ... ``` JSON block
     * into a structured AssistantActionDto. The block is stripped from the
     * human-readable reply text.
     */
    ChatResponse parseReply(String rawReply) {
        if (rawReply == null) {
            return new ChatResponse("");
        }

        Matcher matcher = ACTION_BLOCK_PATTERN.matcher(rawReply);
        if (!matcher.find()) {
            return new ChatResponse(rawReply.trim());
        }

        String json = matcher.group(1).trim();
        String prose = (rawReply.substring(0, matcher.start()) + rawReply.substring(matcher.end())).trim();

        AssistantActionDto action = tryParseAction(json);
        if (action == null) {
            // Malformed or disallowed — return prose only, drop the block silently.
            return new ChatResponse(prose);
        }

        return new ChatResponse(prose, action);
    }

    @SuppressWarnings("unchecked")
    private AssistantActionDto tryParseAction(String json) {
        try {
            Map<String, Object> parsed = objectMapper.readValue(json, Map.class);
            Object typeObj = parsed.get("type");
            if (!(typeObj instanceof String)) {
                logger.warn("Action block missing 'type' field");
                return null;
            }
            String type = (String) typeObj;
            if (!ALLOWED_ACTION_TYPES.contains(type)) {
                logger.warn("Action block has disallowed type: {}", type);
                return null;
            }

            Object payloadObj = parsed.get("payload");
            Map<String, Object> payload;
            if (payloadObj instanceof Map) {
                payload = (Map<String, Object>) payloadObj;
            } else {
                // Tolerate the model putting fields at the top level alongside `type`.
                payload = new HashMap<>(parsed);
                payload.remove("type");
            }

            // Minimal required-field validation.
            if ("create_activity".equals(type) && !(payload.get("title") instanceof String)) {
                logger.warn("create_activity action missing title");
                return null;
            }
            if ("create_event".equals(type)) {
                if (!(payload.get("title") instanceof String) || !(payload.get("date") instanceof String)) {
                    logger.warn("create_event action missing title or date");
                    return null;
                }
            }

            return new AssistantActionDto(type, payload);
        } catch (Exception e) {
            logger.warn("Failed to parse action JSON: {}", e.getMessage());
            return null;
        }
    }
}
