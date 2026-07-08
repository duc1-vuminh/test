#!/bin/bash

APP_NAME=healthcheck-app

# Install Docker if missing
if ! command -v docker >/dev/null 2>&1; then
    echo "Docker not found. Installing Docker..."

    apt-get update

    apt-get install -y docker.io

    systemctl enable docker
    systemctl start docker

    echo "Docker installed."
fi

echo "Stopping old container..."

docker stop $APP_NAME 2>/dev/null
docker rm $APP_NAME 2>/dev/null

echo "Building image..."

docker build \
    -t $APP_NAME \
    -f Dockerfile \
    ..

echo "Starting container..."

docker run -d \
    --name $APP_NAME \
    --restart always \
    -p 7001:7001 \
    -v $(pwd)/profile.ini:/app/profile.ini \
    $APP_NAME

echo "Done."

docker ps | grep $APP_NAME