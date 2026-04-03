#!/bin/sh
set -eu

image_url="${1:-}"

if [ -z "$image_url" ]; then
  echo "usage: $0 <image-tar-url>"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required"
  exit 1
fi

curl -fsS "$image_url" | docker load
