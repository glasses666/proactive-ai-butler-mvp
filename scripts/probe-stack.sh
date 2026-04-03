#!/bin/sh
set -eu

base_url="${1:-http://127.0.0.1:8787}"
ha_url="${2:-http://127.0.0.1:8123}"
mcp_url="${3:-http://127.0.0.1:8790}"

echo "== butler health =="
curl -fsS "$base_url/api/health"
echo
echo "== runtime summary =="
curl -fsS "$base_url/api/runtime/summary"
echo
echo "== runtime devices =="
curl -fsS "$base_url/api/runtime/devices"
echo
echo "== feed snapshot =="
curl -fsS "$base_url/api/feed"
echo
echo "== runtime scene suggestions =="
curl -fsS -X POST "$base_url/api/runtime/scene-suggestions" \
  -H 'content-type: application/json' \
  -d '{"utterance":"我今天很累，回家了"}'
echo
echo "== cycle travel_preparation =="
curl -fsS -X POST "$base_url/api/cycle" \
  -H 'content-type: application/json' \
  -d '{"scenario":"travel_preparation"}'
echo
echo "== butler mcp health =="
curl -fsS "$mcp_url/health"
echo
echo "== home assistant =="
curl -fsS "$ha_url" >/dev/null
echo "home assistant reachable"
