#!/bin/sh
set -eu

bundle_name="${1:-proactive-ai-butler-mvp.tgz}"
root_dir="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
stage_dir="$root_dir/.bundle-stage"

rm -rf "$stage_dir"
mkdir -p "$stage_dir"

copy_path() {
  src="$1"
  dest="$stage_dir/$1"
  mkdir -p "$(dirname "$dest")"
  cp -R "$root_dir/$src" "$dest"
}

copy_path Dockerfile
copy_path README.md
copy_path docker-compose.yml
copy_path .env.example
copy_path package.json
copy_path package-lock.json
copy_path tsconfig.json
copy_path public
copy_path src
copy_path infra
copy_path scripts

COPYFILE_DISABLE=1 tar -C "$stage_dir" -czf "$root_dir/$bundle_name" .
rm -rf "$stage_dir"

printf 'Created bundle: %s\n' "$root_dir/$bundle_name"
