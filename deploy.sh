#!/bin/bash

# Deploy script for direct server execution
set -e

echo "Starting deployment process..."

# Navigate to project directory
cd /home/$(whoami)/motivium-bot

# Pull latest changes
echo "Pulling latest changes from git..."
git pull origin main

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down || true

# Clean up old images and containers
echo "Cleaning up old Docker resources..."
docker system prune -f || true

# Build new image locally (fallback if registry fails)
echo "Building Docker image locally..."
docker-compose build --no-cache bot

# Start services
echo "Starting services..."
docker-compose up -d

# Show status
echo "Checking service status..."
docker-compose ps

echo "Deployment completed successfully!"