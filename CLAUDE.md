# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Full-stack scheduler app: Spring Boot backend (Java 21) + React/TypeScript frontend + MySQL 8.0, orchestrated with Docker Compose.

- **Backend** (`/backend`): REST API on port 8080. Stateless JWT auth, Spring Security, JPA/Hibernate.
- **Frontend** (`/frontend`): React 19 + Vite + MUI v7 + MUI X Date/Time Pickers. Served by Nginx on port 80 (mapped to 5173 in Docker).
- **Database**: MySQL 8.0 (`scheduler_db`). Schema managed by Hibernate `ddl-auto=update`.

### Backend package layout (`com.scheduler.app`)
- `controller/` — AuthController, ActivityController, EventController, ObjectiveController, GoalEntryController, GoogleCalendarController
- `model/` — User, Activity, Event, Objective, GoalEntry, GoogleCalendarToken (JPA entities with UUID PKs), Priority enum, StrategyStatus enum
- `repository/` — Spring Data JPA repos with custom `findByUserId*` queries; ObjectiveRepository (by academicYear), GoalEntryRepository (by objectiveIds)
- `service/` — GoogleCalendarService (OAuth2 flow, token management, event sync)
- `security/` — WebSecurityConfig, JWT filter (AuthTokenFilter), JwtUtils, UserDetailsServiceImpl
- `payload/request/` — LoginRequest, SignupRequest, ActivityRequest, EventRequest, ObjectiveRequest, GoalEntryRequest, ChangePasswordRequest
- `payload/response/` — JwtResponse, MessageResponse, EventResponse

### Frontend layout (`/frontend/src`)
- `api/axios.ts` — Axios instance (base URL `http://localhost:8080/api`) with Bearer token interceptor
- `api/goalsApi.ts` — API calls for objectives and goal entries
- `context/AuthContext.tsx` — Auth state + localStorage persistence (token + user JSON)
- `pages/` — LoginPage, RegisterPage, DashboardPage (weekly planner), YearlyGoalsPage (OGSM framework)
- `components/WeekScheduler/` — 7-day calendar (6 AM–midnight, 60px/hour), DayColumn with dnd-kit drop targets
- `components/ActivityList.tsx` — Draggable activity cards (dnd-kit useDraggable)
- `components/YearlyGoals/` — ObjectiveAccordion, ObjectiveFormDialog, GoalEntryFormDialog, OGSMTable, AcademicYearSelector
- `components/` — GoogleCalendarButton, ChangePasswordDialog, ConfirmDialog, NavigationDrawer, AppBarUserSection, EventDialog, ActivityFormDialog, ActivityDetails
- `utils/` — exportGoals.ts (Excel export via xlsx), academicYear.ts (Sept–Aug year calc), priority.ts (color utils)
- `types/index.ts` — Shared TypeScript interfaces (User, Activity, ScheduledEvent, Objective, GoalEntry, Priority, StrategyStatus)

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

**Security**:
- `/api/auth/**` is public; all other endpoints require a valid JWT
- CORS is wildcard (`*`) — intended for dev; restrict for production
- Passwords encoded with BCrypt; JWT signed with HS256

**Key frontend dependencies**: `@mui/x-date-pickers` (date/time inputs), `xlsx` (Excel export), `date-fns` + `@date-io/date-fns` (date utilities), `@dnd-kit/*` (drag and drop)

**H2 test DB**: backend tests use a separate `application.properties` in `src/test/resources/`
