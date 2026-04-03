#!/bin/sh
set -eu

base_url="${1:-http://127.0.0.1:8787}"
ha_url="${2:-http://127.0.0.1:8123}"

echo "== butler health =="
curl -fsS "$base_url/api/health"
echo
echo "== feed snapshot =="
curl -fsS "$base_url/api/feed"
echo
echo "== cycle travel_preparation =="
curl -fsS -X POST "$base_url/api/cycle" \
  -H 'content-type: application/json' \
  -d '{"scenario":"travel_preparation"}'
echo
echo "== home assistant =="
curl -fsS "$ha_url" >/dev/null
echo "home assistant reachable"
