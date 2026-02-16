# WayFin - Docker Deployment Guide

Complete guide for running WayFin financial management application using Docker and docker-compose.

## Oracle Always Free

For Oracle VM production deployment (app on port 80, API/DB internal only), use:

- `docker-compose.yml` + `docker-compose.oracle.yml`
- Guide: `DEPLOY_ORACLE_ALWAYS_FREE.md`
- Env template: `server/.env.oracle.example`

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Environment Setup

Create environment files from templates:

```bash
# Server environment
cp server/.env.example server/.env

# Client environment (optional)
cp client/.env.example client/.env
```

**Important:** Edit `server/.env` and change the `JWT_SECRET` to a secure random string.

### 2. Build and Start

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5001
- **MongoDB**: localhost:27018

## Development Mode

For development with hot-reload:

```bash
# Start only MongoDB
docker-compose up -d mongodb

# Run server locally
cd server
npm install
npm run dev

# Run client locally (in another terminal)
cd client
npm install
npm run dev
```

## Common Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild specific service
docker-compose build [service_name]

# Restart specific service
docker-compose restart [service_name]

# Execute command in container
docker-compose exec server sh
docker-compose exec client sh
```

## Service Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:5001/api/health  # Server
curl http://localhost:8080/health      # Client
```

## Data Persistence

MongoDB data is persisted in Docker volumes:

```bash
# List volumes
docker volume ls

# Backup MongoDB data
docker-compose exec mongodb mongodump --out=/data/backup

# Restore MongoDB data
docker-compose exec mongodb mongorestore /data/backup
```

## Environment Variables

### Server (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017/wayfin` |
| `JWT_SECRET` | JWT signing secret | **MUST CHANGE** |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:8080` |

### Client (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5001/api` |

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs [service_name]

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database connection issues

```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec server sh
# Inside container:
# node -e "require('mongoose').connect('mongodb://mongodb:27017/wayfin').then(() => console.log('Connected'))"
```

### Port conflicts

If ports 3000, 5000, or 27017 are already in use, modify `docker-compose.yml`:

```yaml
services:
  client:
    ports:
      - "8080:80"  # Change 3000 to 8080
  server:
    ports:
      - "8000:5000"  # Change 5000 to 8000
  mongodb:
    ports:
      - "27018:27017"  # Change 27017 to 27018
```

### Reset everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Update `CORS_ORIGIN` to your production domain
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS/TLS (use reverse proxy like Nginx or Traefik)
- [ ] Implement MongoDB authentication
- [ ] Set up regular database backups
- [ ] Configure log rotation
- [ ] Use Docker secrets for sensitive data

### Recommended Production Setup

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mongodb:
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    
  server:
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/wayfin?authSource=admin
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        max_attempts: 3
```

## Performance Optimization

### Build optimization

```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose build

# Multi-platform builds
docker buildx build --platform linux/amd64,linux/arm64 -t wayfin-server ./server
```

### Resource limits

Add to `docker-compose.yml`:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

## Monitoring

### Container stats

```bash
# Real-time resource usage
docker stats

# Specific service
docker stats wayfin-server
```

### Logs

```bash
# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f server
```

## Backup and Restore

### Database Backup

```bash
# Create backup
docker-compose exec mongodb mongodump --out=/tmp/backup
docker cp wayfin-mongodb:/tmp/backup ./backup-$(date +%Y%m%d)

# Restore backup
docker cp ./backup-20260216 wayfin-mongodb:/tmp/restore
docker-compose exec mongodb mongorestore /tmp/restore
```

### Volume Backup

```bash
# Backup volume
docker run --rm -v wayfin_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz /data

# Restore volume
docker run --rm -v wayfin_mongodb_data:/data -v $(pwd):/backup alpine tar xzf /backup/mongodb-backup.tar.gz -C /
```

## Support

For issues and questions:
- Check logs: `docker-compose logs`
- Verify health: `docker-compose ps`
- Review this documentation
- Check Docker and docker-compose versions
