#!/bin/bash

APP_NAME=healthcheck-app

# Load host environment
if [ -f /etc/environment ]; then
    set -a
    source /etc/environment
    set +a
fi

# Install Docker if missing
if ! command -v docker >/dev/null 2>&1; then
    echo "Docker not found. Installing Docker..."

    apt-get update
    apt-get install -y docker.io

    systemctl enable docker
    systemctl start docker

    echo "Docker installed."
fi

#
# Persist snapshot queue
#
mkdir -p /var/live-shadow

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
    -v $(pwd)/profile.ini:/app/profile.ini:ro \
    -v /var/live-shadow:/tmp/live-shadow \
    -v /var/daily-snapshots:/tmp/daily-snapshots \
    -e TESTNOMY_INSTANCE_ID="$TESTNOMY_INSTANCE_ID" \
    -e TESTNOMY_S3_BUCKET="$TESTNOMY_S3_BUCKET" \
    -e TESTNOMY_REGION="$TESTNOMY_REGION" \
    $APP_NAME

echo "Done."

docker ps | grep $APP_NAME