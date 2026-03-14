# Scheduler App

A comprehensive scheduling application featuring a **Spring Boot** backend, a **React (Vite)** frontend, and a **MySQL** database.

## Features

- **User Authentication:** Secure Login and Registration using JWT tokens.
- **Activity Management:** Create, Edit, and Delete activity templates (Backlog).
- **Weekly Scheduler:** 
  - Drag and drop activities into a 7-day calendar.
  - Interactive event scheduling with start time and duration.
  - "Spare Section" for events without a specific time.
  - Visual status tracking with checkboxes for completed tasks.
- **Dockerized Environment:** One-command setup for the entire stack.

## Tech Stack

- **Backend:** Java 21, Spring Boot 3, Spring Security, JWT, JPA/Hibernate.
- **Frontend:** React 19, TypeScript, Vite, Material UI (MUI) v6, dnd-kit, Axios.
- **Database:** MySQL 8.0.

---

## Getting Started with Docker

The easiest way to run the entire application is using Docker Compose.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Running the Application

To build and start all services (Frontend, Backend, Database) with a **custom project name**:

```bash
docker-compose -p scheduler-app up -d --build
```

- `-p scheduler-app`: Sets the project name to `scheduler-app` (this prefixes networks and volumes).
- `-d`: Runs containers in detached mode (background).
- `--build`: Forces a rebuild of the images (recommended for the first run or after code changes).

### Accessing the App

- **Frontend UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)
- **API Documentation (Swagger):** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Stopping the App

To stop and remove the containers associated with your named project:

```bash
docker-compose -p scheduler-app down
```

---

## Manual Development Setup

If you prefer to run services individually for development:

### Backend
1. Ensure a MySQL instance is running (or use `backend/docker-compose.yml`).
2. Update `backend/src/main/resources/application.properties` if needed.
3. Run:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

### Frontend
1. Ensure the backend is running.
2. Run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Project Structure

```text
├── backend/            # Spring Boot Application
│   ├── Dockerfile      # Multi-stage build for Java
│   └── src/            # Source code (API, Security, Models)
├── frontend/           # React TypeScript Application
│   ├── Dockerfile      # Multi-stage build with Nginx
│   ├── nginx.conf      # SPA routing configuration
│   └── src/            # Components, Pages, Logic
└── docker-compose.yml  # Root orchestration file
```
