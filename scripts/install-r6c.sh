#!/bin/sh
set -eu

project_dir="${1:-$HOME/proactive-ai-butler-mvp}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required"
  exit 1
fi

mkdir -p "$project_dir"
cd "$project_dir"

if [ ! -f .env ]; then
  cp .env.example .env
fi

if docker image inspect proactive-ai-butler-mvp-butler-app:latest >/dev/null 2>&1; then
  docker compose up -d --no-build
else
  DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker compose up -d --build
fi

echo "Stack started in $project_dir"
