# Docker Deployment Guide 🐳

Complete guide to deploying TaskBoard Pro using Docker and Docker Compose.

## Quick Start (5 minutes)

### 1. Prerequisites
```bash
# Check Docker is installed
docker --version
docker-compose --version

# Should show Docker 20+ and Docker Compose 2+
```

### 2. Set Environment Variables
Create a `.env` file in the project root:

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and add to .env file:
JWT_SECRET=your-generated-secret-here
```

### 3. Start Everything
```bash
# Build and start (takes 2-3 minutes first time)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 4. Access Application
Open your browser to:
- **Application**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017/taskboard

### 5. Stop Everything
```bash
docker-compose down

# To remove data volumes as well:
docker-compose down -v
```

---

## Development Mode

### With Hot Reload
```bash
# Start only MongoDB in Docker
docker-compose up -d mongo

# Run app locally with hot reload
npm run dev
```

### View Logs
```bash
# All services
docker-compose logs -f

# Just app
docker-compose logs -f app

# Just MongoDB
docker-compose logs -f mongo
```

### Restart Services
```bash
# Restart everything
docker-compose restart

# Restart just app
docker-compose restart app
```

---

## Production Deployment

### Step 1: Build Production Image
```bash
# Build the image
docker build -t taskboard-pro:latest .

# Test it locally
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/taskboard \
  -e JWT_SECRET=your-secret \
  taskboard-pro:latest
```

### Step 2: Use Production Compose
```bash
# Copy and edit environment
cp .env.example .env
nano .env

# Set these variables:
# JWT_SECRET=your-production-secret
# MONGO_ROOT_USERNAME=admin
# MONGO_ROOT_PASSWORD=strong-password

# Start production stack
docker-compose -f docker-compose.prod.yml up -d
```

### Step 3: Enable HTTPS (Optional)
1. Get SSL certificates (Let's Encrypt recommended)
2. Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/socket {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
3. Start with nginx: `docker-compose -f docker-compose.prod.yml up -d`

---

## Cloud Deployment

### AWS ECS/Fargate

1. **Push to ECR**:
```bash
aws ecr create-repository --repository-name taskboard-pro
docker tag taskboard-pro:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/taskboard-pro:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/taskboard-pro:latest
```

2. **Create Task Definition**:
```json
{
  "family": "taskboard-pro",
  "containerDefinitions": [{
    "name": "app",
    "image": "<your-ecr-image>",
    "portMappings": [{"containerPort": 3000}],
    "environment": [
      {"name": "MONGODB_URI", "value": "<your-mongodb-uri>"},
      {"name": "JWT_SECRET", "value": "<your-jwt-secret>"}
    ]
  }]
}
```

3. **Deploy Service**:
```bash
aws ecs create-service \
  --cluster taskboard-cluster \
  --service-name taskboard-service \
  --task-definition taskboard-pro \
  --desired-count 2 \
  --launch-type FARGATE
```

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT-ID/taskboard-pro

# Deploy
gcloud run deploy taskboard-pro \
  --image gcr.io/PROJECT-ID/taskboard-pro \
  --platform managed \
  --region us-central1 \
  --set-env-vars MONGODB_URI=<uri>,JWT_SECRET=<secret>
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Select "Docker" as build type
3. Set environment variables in dashboard
4. Deploy automatically on push

### Heroku Container Registry

```bash
# Login to Heroku
heroku login
heroku container:login

# Create app
heroku create taskboard-pro

# Set environment
heroku config:set JWT_SECRET=<secret>
heroku config:set MONGODB_URI=<uri>

# Push and release
heroku container:push web
heroku container:release web
```

---

## Database Management

### Backup MongoDB
```bash
# Backup
docker-compose exec mongo mongodump --out=/data/backup

# Copy to host
docker cp taskboard-mongo:/data/backup ./backup

# Restore
docker-compose exec mongo mongorestore /data/backup
```

### Access MongoDB Shell
```bash
# Development
docker-compose exec mongo mongosh taskboard

# Production (with auth)
docker-compose exec mongo mongosh -u admin -p changeme --authenticationDatabase admin taskboard
```

### View Collections
```javascript
// Inside mongosh
show dbs
use taskboard
show collections
db.tasks.find().pretty()
db.projects.find().pretty()
```

---

## Troubleshooting

### App Won't Start
```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. MongoDB not ready - wait 30s and try again
# 2. Port 3000 in use - change in docker-compose.yml
# 3. Build failed - run: docker-compose build --no-cache
```

### MongoDB Connection Error
```bash
# Check MongoDB is running
docker-compose ps mongo

# Check connectivity
docker-compose exec app ping mongo

# Verify connection string
docker-compose exec app env | grep MONGODB_URI
```

### Build Takes Too Long
```bash
# Clear Docker cache
docker builder prune

# Use BuildKit (faster)
DOCKER_BUILDKIT=1 docker-compose build

# Multi-stage build optimization
docker build --target runner -t taskboard-pro .
```

### Out of Disk Space
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

---

## Monitoring

### Health Checks
```bash
# App health
curl http://localhost:3000/api/auth/me

# MongoDB health
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

### Resource Usage
```bash
# All containers
docker stats

# Specific container
docker stats taskboard-app
```

### Container Logs
```bash
# Real-time
docker-compose logs -f --tail=100

# Save to file
docker-compose logs > logs.txt
```

---

## Scaling

### Horizontal Scaling
```bash
# Run multiple app instances
docker-compose up -d --scale app=3

# Use load balancer (nginx/traefik)
# Configure sticky sessions for WebSocket
```

### Vertical Scaling
```yaml
# In docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

---

## Security Best Practices

1. **Use Strong Secrets**:
```bash
# Generate secure JWT secret (min 32 chars)
openssl rand -hex 32
```

2. **Network Isolation**:
```yaml
# Use internal networks
networks:
  frontend:
  backend:
    internal: true
```

3. **Non-Root User**:
```dockerfile
# Already in Dockerfile
USER nextjs
```

4. **Read-Only Filesystem**:
```yaml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
```

5. **Regular Updates**:
```bash
# Update base images
docker-compose pull
docker-compose up -d
```

---

## Common Commands Cheat Sheet

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild
docker-compose build

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec app sh

# Scale service
docker-compose up -d --scale app=3

# Update images
docker-compose pull && docker-compose up -d

# Clean up
docker-compose down -v
docker system prune -a

# Backup data
docker-compose exec mongo mongodump --archive=/data/backup.archive
docker cp taskboard-mongo:/data/backup.archive ./backup.archive
```

---

## Support

For issues:
- Check logs: `docker-compose logs -f`
- Verify `.env` file exists with `JWT_SECRET`
- Ensure ports 3000 and 27017 are available
- Review documentation: README.md

---

**Happy Deploying! 🚀**

