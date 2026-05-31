# Deploy Workflow

This workflow handles deploying the SchedulerApp using Docker Compose on Windows 11.

## Steps

### 1. Check if Docker Desktop is running

Open PowerShell or Command Prompt and run:

```powershell
docker info
```

- If the command succeeds and shows Docker information, Docker Desktop is running — proceed to step 3.
- If the command fails with an error like `Cannot connect to the Docker daemon`, Docker Desktop is not running — proceed to step 2.

### 2. Start Docker Desktop

If Docker Desktop is not running, launch it manually or via command:

```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

Wait for Docker to finish starting up. You can verify readiness by polling with:

```powershell
docker info
```

Repeat until the command succeeds.

### 3. Shut down the application

```powershell
docker-compose -p scheduler-app down
```

This stops and removes all containers, networks, and default volumes for the `scheduler-app` project.

### 4. Build and start the application

```powershell
docker-compose -p scheduler-app up -d --build
```

- `--build` forces a rebuild of the images before starting.
- `-d` runs the containers in detached (background) mode.

### 5. Verify the deployment

Check that all containers are running:

```powershell
docker ps
```

Expected output should show containers for `backend`, `frontend`, and `db` with status `Up`.

Test the endpoints:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/swagger-ui.html

### Troubleshooting

- If the backend container exits immediately, check logs: `docker compose -p scheduler-app logs backend`
- If the frontend container exits immediately, check logs: `docker compose -p scheduler-app logs frontend`
- If the DB container fails, ensure port 3306 is not already in use by a local MySQL instance.