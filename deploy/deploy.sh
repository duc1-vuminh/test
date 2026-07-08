#!/bin/sh

APP_NAME=healthcheck-app

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

echo "Done"
docker ps | grep $APP_NAME