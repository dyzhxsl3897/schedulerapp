package com.scheduler.app.controller;

import com.scheduler.app.model.GoogleCalendarToken;
import com.scheduler.app.model.Event;
import com.scheduler.app.payload.response.MessageResponse;
import com.scheduler.app.repository.GoogleCalendarTokenRepository;
import com.scheduler.app.repository.UserRepository;
import com.scheduler.app.security.jwt.JwtUtils;
import com.scheduler.app.security.services.UserDetailsImpl;
import com.scheduler.app.service.GoogleCalendarService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/google")
public class GoogleCalendarController {

    private static final Logger logger = LoggerFactory.getLogger(GoogleCalendarController.class);

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private GoogleCalendarTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/auth-url")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getAuthUrl() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        // Use user ID as state for CSRF protection
        String state = userDetails.getId().toString();
        String url = googleCalendarService.getAuthorizationUrl(state);

        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/callback")
    public ResponseEntity<String> handleCallback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error) {

        if (error != null) {
            return ResponseEntity.ok(buildCallbackHtml("GOOGLE_AUTH_ERROR", error));
        }

        try {
            if (state == null) {
                return ResponseEntity.ok(buildCallbackHtml("GOOGLE_AUTH_ERROR", "Missing state parameter"));
            }

            UUID userId = UUID.fromString(state);

            // Verify user exists
            if (!userRepository.existsById(userId)) {
                return ResponseEntity.ok(buildCallbackHtml("GOOGLE_AUTH_ERROR", "Invalid user"));
            }

            googleCalendarService.exchangeCodeForTokens(code, userId);

            return ResponseEntity.ok(buildCallbackHtml("GOOGLE_AUTH_SUCCESS", null));
        } catch (Exception e) {
            logger.error("Google OAuth callback error", e);
            return ResponseEntity.ok(buildCallbackHtml("GOOGLE_AUTH_ERROR", "Authentication failed"));
        }
    }

    @PostMapping("/sync")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> syncEvents(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        try {
            List<Event> imported = googleCalendarService.syncEvents(userDetails.getId(), start, end);
            return ResponseEntity.ok(Map.of(
                    "message", "Synced " + imported.size() + " events",
                    "count", imported.size()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Google Calendar sync error", e);
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Failed to sync Google Calendar events"));
        }
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getStatus() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        Optional<GoogleCalendarToken> token = tokenRepository.findByUserId(userDetails.getId());

        if (token.isPresent()) {
            return ResponseEntity.ok(Map.of(
                    "connected", true,
                    "email", token.get().getGoogleEmail() != null ? token.get().getGoogleEmail() : ""
            ));
        } else {
            return ResponseEntity.ok(Map.of("connected", false, "email", ""));
        }
    }

    @DeleteMapping("/disconnect")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> disconnect() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        googleCalendarService.revokeToken(userDetails.getId());
        return ResponseEntity.ok(new MessageResponse("Google Calendar disconnected"));
    }

    private String buildCallbackHtml(String type, String error) {
        String errorData = error != null ? ", error: '" + error.replace("'", "\\'") + "'" : "";
        return """
                <!DOCTYPE html>
                <html>
                <body>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ type: '%s'%s }, '*');
                  }
                  window.close();
                </script>
                <p>Authentication complete. This window should close automatically.</p>
                </body>
                </html>
                """.formatted(type, errorData);
    }
}
