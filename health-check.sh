#!/bin/bash

# Health check script for the deployment
set -e

echo "Checking deployment health..."

# Check if containers are running
echo "Checking container status..."
docker-compose ps

# Check bot logs for any errors
echo "Checking bot logs (last 20 lines)..."
docker-compose logs --tail=20 bot

# Check database connection
echo "Checking database status..."
docker-compose logs --tail=10 db

# Check if bot is responsive (if there's a health endpoint)
echo "Deployment health check completed."

# Show resource usage
echo "Docker resource usage:"
docker stats --no-stream