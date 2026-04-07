package com.scheduler.app.service;

import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Events;
import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.Credential;
import com.scheduler.app.model.Event;
import com.scheduler.app.model.GoogleCalendarToken;
import com.scheduler.app.repository.EventRepository;
import com.scheduler.app.repository.GoogleCalendarTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GoogleCalendarService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleCalendarService.class);

    @Value("${google.calendar.client-id}")
    private String clientId;

    @Value("${google.calendar.client-secret}")
    private String clientSecret;

    @Value("${google.calendar.redirect-uri}")
    private String redirectUri;

    @Autowired
    private GoogleCalendarTokenRepository tokenRepository;

    @Autowired
    private EventRepository eventRepository;

    private static final NetHttpTransport HTTP_TRANSPORT = new NetHttpTransport();
    private static final JacksonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();

    public String getAuthorizationUrl(String state) {
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                HTTP_TRANSPORT, JSON_FACTORY, clientId, clientSecret,
                List.of(CalendarScopes.CALENDAR_READONLY, "email"))
                .setAccessType("offline")
                .build();

        return flow.newAuthorizationUrl()
                .setRedirectUri(redirectUri)
                .setState(state)
                .set("prompt", "consent select_account")
                .build();
    }

    @Transactional
    public GoogleCalendarToken exchangeCodeForTokens(String code, UUID userId) throws IOException {
        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                HTTP_TRANSPORT, JSON_FACTORY, clientId, clientSecret, code, redirectUri)
                .execute();

        // Get user email from Google
        String email = getGoogleEmail(tokenResponse.getAccessToken());

        GoogleCalendarToken token = tokenRepository.findByUserId(userId)
                .orElse(new GoogleCalendarToken());
        token.setUserId(userId);
        token.setAccessToken(tokenResponse.getAccessToken());
        token.setRefreshToken(tokenResponse.getRefreshToken() != null
                ? tokenResponse.getRefreshToken() : token.getRefreshToken());
        token.setTokenExpiry(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresInSeconds()));
        token.setGoogleEmail(email);

        return tokenRepository.save(token);
    }

    public List<Event> syncEvents(UUID userId, LocalDate start, LocalDate end) throws IOException {
        GoogleCalendarToken token = tokenRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Google Calendar not connected"));

        ensureValidToken(token);

        Calendar calendarService = buildCalendarService(token.getAccessToken());

        ZoneId syncZone = ZoneId.systemDefault();
        DateTime timeMin = new DateTime(start.atStartOfDay(syncZone).toInstant().toEpochMilli());
        DateTime timeMax = new DateTime(end.plusDays(1).atStartOfDay(syncZone).toInstant().toEpochMilli());

        Events googleEvents = calendarService.events().list("primary")
                .setTimeMin(timeMin)
                .setTimeMax(timeMax)
                .setSingleEvents(true)
                .setOrderBy("startTime")
                .execute();

        List<com.google.api.services.calendar.model.Event> items = googleEvents.getItems();
        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }

        // Deduplication: find existing events with these google IDs
        List<String> googleEventIds = items.stream()
                .map(com.google.api.services.calendar.model.Event::getId)
                .collect(Collectors.toList());

        Map<String, Event> existingByGoogleId = eventRepository
                .findByUserIdAndGoogleEventIdIn(userId, googleEventIds).stream()
                .collect(Collectors.toMap(Event::getGoogleEventId, e -> e));

        List<Event> savedEvents = new ArrayList<>();

        for (com.google.api.services.calendar.model.Event gEvent : items) {
            Event existing = existingByGoogleId.get(gEvent.getId());
            Event event = existing != null ? existing : new Event();

            convertGoogleEvent(gEvent, event, userId);
            savedEvents.add(eventRepository.save(event));
        }

        return savedEvents;
    }

    private void convertGoogleEvent(com.google.api.services.calendar.model.Event gEvent,
                                     Event event, UUID userId) {
        event.setUserId(userId);
        event.setGoogleEventId(gEvent.getId());
        event.setTitle(gEvent.getSummary() != null ? gEvent.getSummary() : "(No title)");
        event.setDescription(gEvent.getDescription());

        if (gEvent.getStart() != null && gEvent.getStart().getDateTime() != null) {
            // Timed event
            Instant startInstant = Instant.ofEpochMilli(gEvent.getStart().getDateTime().getValue());
            String tzId = gEvent.getStart().getTimeZone();
            ZoneId zone = (tzId != null) ? ZoneId.of(tzId) : ZoneId.systemDefault();
            ZonedDateTime startZdt = startInstant.atZone(zone);
            event.setDate(startZdt.toLocalDate());
            event.setStartTime(startZdt.toLocalTime());

            if (gEvent.getEnd() != null && gEvent.getEnd().getDateTime() != null) {
                Instant endInstant = Instant.ofEpochMilli(gEvent.getEnd().getDateTime().getValue());
                long durationMinutes = Duration.between(startInstant, endInstant).toMinutes();
                event.setDurationMinutes((int) durationMinutes);
            }
        } else if (gEvent.getStart() != null && gEvent.getStart().getDate() != null) {
            // All-day event
            String dateStr = gEvent.getStart().getDate().toStringRfc3339();
            event.setDate(LocalDate.parse(dateStr));
            event.setStartTime(null);
            event.setDurationMinutes(null);
        }
    }

    private void ensureValidToken(GoogleCalendarToken token) throws IOException {
        if (token.getTokenExpiry() != null && token.getTokenExpiry().isBefore(LocalDateTime.now())) {
            refreshAccessToken(token);
        }
    }

    private void refreshAccessToken(GoogleCalendarToken token) throws IOException {
        if (token.getRefreshToken() == null) {
            throw new IllegalStateException("No refresh token available. Please reconnect Google Calendar.");
        }

        com.google.api.client.googleapis.auth.oauth2.GoogleRefreshTokenRequest refreshRequest =
                new com.google.api.client.googleapis.auth.oauth2.GoogleRefreshTokenRequest(
                        HTTP_TRANSPORT, JSON_FACTORY, token.getRefreshToken(), clientId, clientSecret);

        TokenResponse tokenResponse = refreshRequest.execute();

        token.setAccessToken(tokenResponse.getAccessToken());
        token.setTokenExpiry(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresInSeconds()));
        tokenRepository.save(token);
    }

    private Calendar buildCalendarService(String accessToken) {
        Credential credential = new Credential(BearerToken.authorizationHeaderAccessMethod())
                .setAccessToken(accessToken);

        return new Calendar.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName("Scheduler App")
                .build();
    }

    @Transactional
    public void revokeToken(UUID userId) {
        Optional<GoogleCalendarToken> tokenOpt = tokenRepository.findByUserId(userId);
        if (tokenOpt.isEmpty()) {
            return;
        }

        GoogleCalendarToken token = tokenOpt.get();

        // Best-effort revoke with Google
        try {
            var content = new com.google.api.client.http.UrlEncodedContent(
                    java.util.Map.of("token", token.getAccessToken()));
            var request = HTTP_TRANSPORT.createRequestFactory()
                    .buildPostRequest(
                            new com.google.api.client.http.GenericUrl(
                                    "https://oauth2.googleapis.com/revoke"),
                            content);
            request.execute();
        } catch (Exception e) {
            logger.warn("Failed to revoke Google token (best-effort)", e);
        }

        tokenRepository.deleteByUserId(userId);
    }

    private String getGoogleEmail(String accessToken) {
        try {
            var httpTransport = new NetHttpTransport();
            var request = httpTransport.createRequestFactory()
                    .buildGetRequest(new com.google.api.client.http.GenericUrl(
                            "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken));
            var response = request.execute();
            var json = JSON_FACTORY.createJsonParser(response.getContent());
            var map = json.parse(Map.class);
            return (String) map.get("email");
        } catch (Exception e) {
            logger.warn("Could not fetch Google email", e);
            return null;
        }
    }
}
