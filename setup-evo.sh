#!/bin/bash
mkdir -p /opt/evolution/instances
mkdir -p /opt/evolution/store
mkdir -p /opt/evolution/redis
mkdir -p /opt/evolution/postgres

cat << 'DOCKER_COMPOSE_EOF' > /opt/evolution/docker-compose.yml
version: "3.7"
services:
  redis:
    image: redis:alpine
    container_name: evo-redis
    restart: always
    volumes:
      - /opt/evolution/redis:/data
    command: redis-server --appendonly yes

  postgres:
    image: postgres:15-alpine
    container_name: evo-postgres
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=evolution_db_pass
      - POSTGRES_DB=evolution_api
    volumes:
      - /opt/evolution/postgres:/var/lib/postgresql/data

  evolution:
    image: evoapicloud/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - redis
      - postgres
    environment:
      - SERVER_PORT=8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=payo_evolution_key_local_2024
      - REDIS_URI=redis://redis:6379
      - CACHE_REDIS_URI=redis://redis:6379/1
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:evolution_db_pass@postgres:5432/evolution_api
      - DATABASE_CONNECTION_CLIENT_NAME=evolution
    volumes:
      - /opt/evolution/instances:/evolution/instances
      - /opt/evolution/store:/evolution/store
DOCKER_COMPOSE_EOF

cd /opt/evolution
docker compose up -d
