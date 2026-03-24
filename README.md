# Scheduler App

A full-stack weekly planner and yearly goal tracker built with Spring Boot, React, and MySQL.

## Features

- **User Authentication:** Secure login and registration using JWT tokens, with password change support.
- **Weekly Planner:** Drag-and-drop scheduling with a 7-day calendar view (6 AM - midnight). Create activities and drag them onto time slots to schedule events. Standalone event creation, sibling event highlighting, and clear-week functionality.
- **Yearly Goals (OGSM):** Track objectives, goals, strategies, and measures organized by academic year (Sept - Aug). Export to Excel or print.
- **Google Calendar Integration:** OAuth2-based sync to import/export events with Google Calendar.
- **Dockerized Environment:** One-command setup for the entire stack.

## Tech Stack

| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Backend  | Java 21, Spring Boot 3, Spring Security, JWT, JPA/Hibernate  |
| Frontend | React 19, TypeScript, Vite, MUI v7, MUI X Date/Time Pickers, dnd-kit |
| Database | MySQL 8.0                                                    |
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

## Project Structure

```text
SchedulerApp/
├── backend/                  # Spring Boot REST API
│   ├── Dockerfile
│   └── src/main/java/com/scheduler/app/
│       ├── controller/       # Auth, Activity, Event, Objective, GoalEntry, GoogleCalendar
│       ├── model/            # JPA entities (User, Activity, Event, Objective, GoalEntry)
│       ├── repository/       # Spring Data JPA repositories
│       ├── service/          # GoogleCalendarService
│       ├── security/         # JWT auth, Spring Security config
│       └── payload/          # Request/response DTOs
├── frontend/                 # React + Vite SPA
│   ├── Dockerfile
│   ├── nginx.conf            # SPA routing configuration
│   └── src/
│       ├── pages/            # LoginPage, RegisterPage, DashboardPage, YearlyGoalsPage
│       ├── components/       # WeekScheduler, YearlyGoals, ActivityList, dialogs
│       ├── api/              # Axios instance, goals API
│       ├── context/          # AuthContext
│       ├── utils/            # Excel export, academic year calc, priority colors
│       └── types/            # TypeScript interfaces
└── docker-compose.yml        # Root orchestration file
```
