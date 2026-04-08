# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Maintenance

Keep this file and `README.md` up to date. Whenever you add new features, models, endpoints, components, or make significant architectural changes, update the relevant sections of both files proactively.

## Architecture

Full-stack scheduler app: Spring Boot backend (Java 21) + React/TypeScript frontend + MySQL 8.0, orchestrated with Docker Compose.

- **Backend** (`/backend`): REST API on port 8080. Stateless JWT auth, Spring Security, JPA/Hibernate.
- **Frontend** (`/frontend`): React 19 + Vite + MUI v7 + MUI X Date/Time Pickers. Served by Nginx on port 80 (mapped to 5173 in Docker).
- **Database**: MySQL 8.0 (`scheduler_db`). Schema managed by Hibernate `ddl-auto=update`.

### Backend package layout (`com.scheduler.app`)
- `controller/` — AuthController, ActivityController, EventController, ObjectiveController, GoalEntryController, GoogleCalendarController, AiChatController
- `model/` — User, Activity, Event, Objective, GoalEntry, GoogleCalendarToken (JPA entities with UUID PKs), Priority enum, StrategyStatus enum
- `repository/` — Spring Data JPA repos with custom `findByUserId*` queries; ObjectiveRepository (by academicYear), GoalEntryRepository (by objectiveIds)
- `service/` — GoogleCalendarService (OAuth2 flow, token management, event sync), AiChatService (AI model proxy)
- `security/` — WebSecurityConfig, JWT filter (AuthTokenFilter), JwtUtils, UserDetailsServiceImpl
- `payload/request/` — LoginRequest, SignupRequest, ActivityRequest, EventRequest, ObjectiveRequest, GoalEntryRequest, ChangePasswordRequest, ChatRequest
- `payload/response/` — JwtResponse, MessageResponse, EventResponse, ChatResponse

### Frontend layout (`/frontend/src`)
- `api/axios.ts` — Axios instance (base URL `http://localhost:8080/api`) with Bearer token interceptor
- `api/goalsApi.ts` — API calls for objectives and goal entries
- `api/assistant.ts` — API call for AI chat (POST /api/ai/chat)
- `context/AuthContext.tsx` — Auth state + localStorage persistence (token + user JSON)
- `pages/` — LoginPage, RegisterPage, DashboardPage (weekly planner), YearlyGoalsPage (OGSM framework)
- `components/WeekScheduler/` — 7-day calendar (desktop) / single-day tabbed view (mobile), DayColumn with dnd-kit drop targets
- `components/ActivityList.tsx` — Draggable activity cards (dnd-kit useDraggable)
- `components/MobileActivitySheet.tsx` — Bottom sheet (SwipeableDrawer) for activities on mobile
- `hooks/useIsMobile.ts` — Shared responsive hook (useMediaQuery at md breakpoint)
- `components/YearlyGoals/` — ObjectiveAccordion, ObjectiveFormDialog, GoalEntryFormDialog, OGSMTable, AcademicYearSelector
- `components/` — GoogleCalendarButton, ChangePasswordDialog, ConfirmDialog, NavigationDrawer, AppBarUserSection, EventDialog, ActivityFormDialog, ActivityDetails, AssistantChat
- `utils/` — exportGoals.ts (Excel export via xlsx), academicYear.ts (Sept–Aug year calc), priority.ts (color utils)
- `types/index.ts` — Shared TypeScript interfaces (User, Activity, ScheduledEvent, Objective, GoalEntry, Priority, StrategyStatus, ChatMessage, AssistantAction)

### Frontend routing
- `/planner` — Weekly planner (DashboardPage)
- `/goals` — Yearly goals (YearlyGoalsPage)
- `/` redirects to `/planner`
- Navigation via left drawer (NavigationDrawer)

### Key data flows
- **Auth**: POST `/api/auth/login` → JWT stored in localStorage → Axios interceptor attaches `Authorization: Bearer <token>` on every request
- **Scheduling**: Drag activity from backlog → drop on DayColumn → EventDialog for startTime/duration → POST `/api/events`
- **Yearly Goals**: OGSM framework (Objective → Goal → Strategy → Measure) grouped by academic year, with Excel export and print support
- **Google Calendar**: OAuth2 flow via `/api/google/auth-url` → callback → sync events between Google Calendar and the app
- **AI Assistant**: Floating chat panel → POST `/api/ai/chat` → backend proxies to configurable OpenAI-compatible API (Ollama, OpenAI, etc.). The model can propose **actions** (`create_activity`, `create_event`) by emitting a fenced ` ```action {...} ``` ` JSON block. `AiChatService.parseReply` extracts and validates it, returns it as `ChatResponse.action`, and the frontend (`AssistantChat` + `api/assistantActions.ts`) executes it via the existing REST endpoints **only after the user clicks Approve**. Successful execution dispatches a `scheduler:assistant-data-changed` window event so `DashboardPage` refreshes. Today's date is appended to the system prompt at runtime so the model can resolve relative dates.
- **User scoping**: All entities have `userId` (UUID); controllers filter by authenticated user's ID

### API endpoints
```
# Auth
POST   /api/auth/login              — Login, returns JWT
POST   /api/auth/signup             — Register new user
POST   /api/auth/change-password    — Change password

# Activities & Events
GET|POST       /api/activities       — List/create activities
PUT|DELETE     /api/activities/{id}  — Update/delete activity
GET|POST       /api/events           — List/create events (query by date range)
PUT|DELETE     /api/events/{id}      — Update/delete event

# Yearly Goals (OGSM)
GET|POST       /api/objectives             — List (by ?academicYear) / create objectives
PUT|DELETE     /api/objectives/{id}        — Update/delete objective (cascade deletes goal entries)
GET|POST       /api/goal-entries           — List (by ?objectiveIds) / create goal entries
PUT|DELETE     /api/goal-entries/{id}      — Update/delete goal entry

# Google Calendar Integration
GET    /api/google/auth-url          — Get OAuth2 authorization URL
GET    /api/google/callback          — OAuth2 callback handler
POST   /api/google/sync              — Sync events (?start, ?end)
GET    /api/google/status            — Check connection status
DELETE /api/google/disconnect        — Disconnect Google Calendar

# AI Assistant
POST   /api/ai/chat                 — Send chat message, returns AI reply
```

## Commands

### Run everything (Docker)
```bash
docker-compose -p scheduler-app up -d --build
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080/api
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### Backend (local dev)
```bash
cd backend
mvn spring-boot:run          # requires local MySQL on port 3306
mvn clean package -DskipTests
mvn test                     # uses H2 in-memory DB (see src/test/resources/application.properties)
mvn test -Dtest=ClassName    # run single test class
```

### Frontend (local dev)
```bash
cd frontend
npm install
npm run dev     # Vite dev server on http://localhost:5173
npm run build   # production build to /dist
npm run lint    # ESLint
```

## Configuration

**Backend** (`backend/src/main/resources/application.properties`):
- DB URL, credentials, JWT secret, and JWT expiration (24h) are set here
- Docker Compose overrides `DB_HOST` env var to point to the `db` service

**Google Calendar** (Docker Compose env vars):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — OAuth2 credentials for Google Calendar integration

**AI Assistant** (Docker Compose env vars or application.properties):
- `AI_API_URL` — OpenAI-compatible chat completions endpoint (default: `http://host.docker.internal:11434/v1/chat/completions` for host Ollama)
- `AI_API_KEY` — API key (empty for local models)
- `AI_API_MODEL` — Model name (default: `qwen2.5:7b-instruct`)
- `AI_API_MAX_TOKENS` — Max response tokens (default: `1024`)
- Backend container reaches host Ollama via `host.docker.internal` (configured in `docker-compose.yml` `extra_hosts: host-gateway`). Ollama must bind to `0.0.0.0:11434` (set `OLLAMA_HOST=0.0.0.0:11434`) — `127.0.0.1` is unreachable from inside the container. Full setup steps in `README.md` → "AI Assistant Setup (Ollama)".

**Security**:
- `/api/auth/**` is public; all other endpoints require a valid JWT
- CORS is wildcard (`*`) — intended for dev; restrict for production
- Passwords encoded with BCrypt; JWT signed with HS256

**Key frontend dependencies**: `@mui/x-date-pickers` (date/time inputs), `xlsx` (Excel export), `date-fns` + `@date-io/date-fns` (date utilities), `@dnd-kit/*` (drag and drop)

**H2 test DB**: backend tests use a separate `application.properties` in `src/test/resources/`
