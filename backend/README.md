# Scheduler App Backend

This is the backend for the Scheduler App, built with Spring Boot and MySQL.

## Prerequisites

- Java 21
- Maven
- Docker (for database)

## Setup

1.  **Database:** Start the MySQL database using Docker Compose.
    ```bash
    docker-compose up -d
    ```

2.  **Build:** Build the project using Maven.
    ```bash
    mvn clean install
    ```

3.  **Run:** Run the application.
    ```bash
    mvn spring-boot:run
    ```

## API Documentation

Once the application is running, you can access the Swagger UI at:
http://localhost:8080/swagger-ui.html

## Testing

Run unit and integration tests:
```bash
mvn test
```

## Security

The application uses JWT for authentication.
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Access protected endpoints with `Authorization: Bearer <token>` header.
