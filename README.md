# Scheduler App

A full-stack weekly planner and yearly goal tracker built with Spring Boot, React, and MySQL.

## Features

- **User Authentication:** Secure login and registration using JWT tokens, with password change support.
- **Weekly Planner:** Drag-and-drop scheduling with a 7-day calendar view (6 AM - midnight). Create activities and drag them onto time slots to schedule events. Standalone event creation, sibling event highlighting, and clear-week functionality.
- **Yearly Goals (OGSM):** Track objectives, goals, strategies, and measures organized by academic year (Sept - Aug). Export to Excel or print.
- **Google Calendar Integration:** OAuth2-based sync to import/export events with Google Calendar.
- **AI Assistant:** Floating, draggable chat panel powered by a configurable OpenAI-compatible AI model (local Ollama, OpenAI, etc.). Scoped to app functionality, with an Approve/Reject flow before any action.
- **Dockerized Environment:** One-command setup for the entire stack.

## Tech Stack

| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Backend  | Java 21, Spring Boot 3, Spring Security, JWT, JPA/Hibernate  |
| Frontend | React 19, TypeScript, Vite, MUI v7, MUI X Date/Time Pickers, dnd-kit |
| Database | MySQL 8.0                                                    |
| AI       | OpenAI-compatible API (Ollama, OpenAI, etc.)                 |
| Infra    | Docker Compose, Nginx                                        |

---

## Getting Started with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Running the Application

```bash
docker-compose -p scheduler-app up -d --build
```

- `-p scheduler-app`: Sets the project name (prefixes networks and volumes).
- `-d`: Runs containers in detached mode.
- `--build`: Forces a rebuild of the images.

### Accessing the App

- **Frontend UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)
- **API Documentation (Swagger):** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Stopping the App

```bash
docker-compose -p scheduler-app down
```

---

## Manual Development Setup

### Backend
Requires a MySQL instance running on port 3306.

```bash
cd backend
mvn spring-boot:run
```

### Frontend
Requires the backend to be running.

```bash
cd frontend
npm install
npm run dev
```

### Testing

```bash
cd backend
mvn test          # uses H2 in-memory DB
```

---

## Configuration

### Backend
Edit `backend/src/main/resources/application.properties` for DB credentials, JWT secret, and token expiration.

### Google Calendar
Set these environment variables (or configure in `docker-compose.yml`):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

---

## AI Assistant Setup (Ollama)

The app ships with a chat-based AI assistant that connects to any OpenAI-compatible chat completions API. The default configuration targets a local [Ollama](https://ollama.com) instance running on the host machine.

### 1. Install Ollama

Download and install from [ollama.com/download](https://ollama.com/download) (Windows, macOS, Linux).

### 2. Pull a Model

Recommended for ~8GB VRAM (e.g. RTX 3070 Ti):

```bash
ollama pull qwen2.5:7b-instruct
```

Other good options:
- `mistral-nemo` — 12B, best French + English, strong tool calling
- `llama3.1:8b` — Solid all-rounder, great English
- `qwen3:4b` — Smaller/faster, fits easily in low VRAM

### 3. Expose Ollama to Docker

By default Ollama listens only on `127.0.0.1`, which the backend container cannot reach. Bind it to all interfaces:

**Windows (PowerShell, then restart Ollama):**
```powershell
setx OLLAMA_HOST "0.0.0.0:11434"
```

**macOS/Linux:**
```bash
export OLLAMA_HOST=0.0.0.0:11434
ollama serve
```

### 4. Verify Ollama is Reachable

```bash
curl http://localhost:11434/v1/models
```

### 5. Run the App

The defaults in `docker-compose.yml` already point to `host.docker.internal:11434` and use `qwen2.5:7b-instruct`. Simply start the stack:

```bash
docker-compose -p scheduler-app up -d --build
```

Log in, click the chat icon in the bottom-right corner, and start chatting.

### 6. Use a Different Model or Provider

Override via environment variables (in your shell or a `.env` file next to `docker-compose.yml`):

| Variable            | Default                                                  | Purpose                                  |
| ------------------- | -------------------------------------------------------- | ---------------------------------------- |
| `AI_API_URL`        | `http://host.docker.internal:11434/v1/chat/completions`  | OpenAI-compatible chat completions URL   |
| `AI_API_KEY`        | _(empty)_                                                | API key (required for OpenAI/paid APIs) |
| `AI_API_MODEL`      | `qwen2.5:7b-instruct`                                    | Model name                               |
| `AI_API_MAX_TOKENS` | `1024`                                                   | Max tokens in response                   |

**Example: Use OpenAI instead of Ollama**
```bash
AI_API_URL=https://api.openai.com/v1/chat/completions \
AI_API_KEY=sk-... \
AI_API_MODEL=gpt-4o-mini \
docker-compose -p scheduler-app up -d
```

### Troubleshooting

- **Assistant says "unable to respond"** — Check backend logs: `docker logs scheduler-backend --tail 50`
- **Connection refused to host.docker.internal** — Ollama is not bound to `0.0.0.0`. See step 3.
- **Slow first response** — The model loads into VRAM on first request. Subsequent calls are much faster.

---

## Project Structure

```text
SchedulerApp/
├── backend/                  # Spring Boot REST API
│   ├── Dockerfile
│   └── src/main/java/com/scheduler/app/
│       ├── controller/       # Auth, Activity, Event, Objective, GoalEntry, GoogleCalendar, AiChat
│       ├── model/            # JPA entities (User, Activity, Event, Objective, GoalEntry)
│       ├── repository/       # Spring Data JPA repositories
│       ├── service/          # GoogleCalendarService, AiChatService
│       ├── security/         # JWT auth, Spring Security config
│       └── payload/          # Request/response DTOs
├── frontend/                 # React + Vite SPA
│   ├── Dockerfile
│   ├── nginx.conf            # SPA routing configuration
│   └── src/
│       ├── pages/            # LoginPage, RegisterPage, DashboardPage, YearlyGoalsPage
│       ├── components/       # WeekScheduler, YearlyGoals, ActivityList, dialogs, AssistantChat
│       ├── api/              # Axios instance, goals API, assistant API
│       ├── context/          # AuthContext
│       ├── utils/            # Excel export, academic year calc, priority colors
│       └── types/            # TypeScript interfaces
└── docker-compose.yml        # Root orchestration file
```
