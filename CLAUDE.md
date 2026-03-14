# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Full-stack scheduler app: Spring Boot backend (Java 21) + React/TypeScript frontend + MySQL 8.0, orchestrated with Docker Compose.

- **Backend** (`/backend`): REST API on port 8080. Stateless JWT auth, Spring Security, JPA/Hibernate.
- **Frontend** (`/frontend`): React 19 + Vite + MUI v7. Served by Nginx on port 80 (mapped to 5173 in Docker).
- **Database**: MySQL 8.0 (`scheduler_db`). Schema managed by Hibernate `ddl-auto=update`.

### Backend package layout (`com.scheduler.app`)
- `controller/` — AuthController, ActivityController, EventController (REST endpoints)
- `model/` — User, Activity, Event (JPA entities with UUID PKs), Priority enum
- `repository/` — Spring Data JPA repos with custom `findByUserId*` queries
- `security/` — WebSecurityConfig, JWT filter (AuthTokenFilter), JwtUtils, UserDetailsServiceImpl
- `payload/` — request/response DTOs (LoginRequest, SignupRequest, JwtResponse, ActivityRequest, EventRequest)

### Frontend layout (`/frontend/src`)
- `api/axios.ts` — Axios instance (base URL `http://localhost:8080/api`) with Bearer token interceptor
- `context/AuthContext.tsx` — Auth state + localStorage persistence (token + user JSON)
- `pages/` — LoginPage, RegisterPage, DashboardPage (main layout)
- `components/WeekScheduler/` — 7-day calendar (6 AM–midnight, 60px/hour), DayColumn with dnd-kit drop targets
- `components/ActivityList.tsx` — Draggable activity cards (dnd-kit useDraggable)
- `types/index.ts` — Shared TypeScript interfaces (User, Activity, ScheduledEvent, Priority enum)

### Key data flows
- **Auth**: POST `/api/auth/login` → JWT stored in localStorage → Axios interceptor attaches `Authorization: Bearer <token>` on every request
- **Scheduling**: Drag activity from backlog → drop on DayColumn → EventDialog for startTime/duration → POST `/api/events`
- **User scoping**: All entities have `userId` (UUID); controllers filter by authenticated user's ID

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

**Security**:
- `/api/auth/**` is public; all other endpoints require a valid JWT
- CORS is wildcard (`*`) — intended for dev; restrict for production
- Passwords encoded with BCrypt; JWT signed with HS256

**H2 test DB**: backend tests use a separate `application.properties` in `src/test/resources/`
