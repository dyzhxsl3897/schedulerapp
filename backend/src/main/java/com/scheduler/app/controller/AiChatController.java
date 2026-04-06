package com.scheduler.app.controller;

import com.scheduler.app.payload.request.ChatRequest;
import com.scheduler.app.payload.response.ChatResponse;
import com.scheduler.app.security.services.UserDetailsImpl;
import com.scheduler.app.service.AiChatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    @Autowired
    private AiChatService aiChatService;

    @PostMapping("/chat")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        UUID userId = userDetails.getId();

        String reply = aiChatService.chat(request, userId);
        return ResponseEntity.ok(new ChatResponse(reply));
    }
}
