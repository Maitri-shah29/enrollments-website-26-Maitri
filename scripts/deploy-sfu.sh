#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.sfu.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env at ${ENV_FILE}" >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing ${COMPOSE_FILE}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${SFU_SECRET:-}" ]]; then
  echo "SFU_SECRET is required in .env" >&2
  exit 1
fi

COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf "%s" "$value"
}

get_pool_url() {
  local id="$1"
  local pool="${SFU_POOL:-}"
  if [[ -n "$pool" ]]; then
    IFS=',' read -ra entries <<< "$pool"
    for entry in "${entries[@]}"; do
      entry="$(trim "$entry")"
      if [[ "$entry" == "$id="* ]]; then
        printf "%s" "${entry#*=}"
        return 0
      fi
    done
  fi

  if [[ "$id" == "sfu-a" ]]; then
    printf "%s" "${SFU_A_URL:-http://127.0.0.1:3031}"
  else
    printf "%s" "${SFU_B_URL:-http://127.0.0.1:3032}"
  fi
}

json_field() {
  local field="$1"
  node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync(0,'utf8'));const val=data['$field'];if(typeof val==='boolean'){console.log(val?'true':'false');}else if(val===undefined||val===null){console.log('');}else{console.log(val);}"
}

status_json() {
  local url="$1"
  curl -fsS -H "x-sfu-secret: ${SFU_SECRET}" "${url}/status" 2>/dev/null || true
}

SFU_A_URL="$(get_pool_url "sfu-a")"
SFU_B_URL="$(get_pool_url "sfu-b")"

echo "Using SFU A: ${SFU_A_URL}"
echo "Using SFU B: ${SFU_B_URL}"

echo "Pulling latest code..."
git -C "$ROOT_DIR" pull

echo "Installing app dependencies..."
npm -C "$ROOT_DIR" install

echo "Ensuring Redis is running..."
"${COMPOSE[@]}" up -d redis

STATUS_A="$(status_json "$SFU_A_URL")"
STATUS_B="$(status_json "$SFU_B_URL")"

ROOMS_A="0"
ROOMS_B="0"
DRAINING_A="unknown"
DRAINING_B="unknown"

if [[ -n "$STATUS_A" ]]; then
  ROOMS_A="$(printf "%s" "$STATUS_A" | json_field rooms || echo "0")"
  DRAINING_A="$(printf "%s" "$STATUS_A" | json_field draining || echo "unknown")"
fi

if [[ -n "$STATUS_B" ]]; then
  ROOMS_B="$(printf "%s" "$STATUS_B" | json_field rooms || echo "0")"
  DRAINING_B="$(printf "%s" "$STATUS_B" | json_field draining || echo "unknown")"
fi

ACTIVE_SERVICE=""
ACTIVE_URL=""

if [[ -n "$STATUS_A" && -n "$STATUS_B" ]]; then
  if (( ROOMS_A > 0 && ROOMS_B == 0 )); then
    ACTIVE_SERVICE="sfu-a"
    ACTIVE_URL="$SFU_A_URL"
  elif (( ROOMS_B > 0 && ROOMS_A == 0 )); then
    ACTIVE_SERVICE="sfu-b"
    ACTIVE_URL="$SFU_B_URL"
  elif [[ "$DRAINING_A" == "false" && "$DRAINING_B" == "true" ]]; then
    ACTIVE_SERVICE="sfu-a"
    ACTIVE_URL="$SFU_A_URL"
  elif [[ "$DRAINING_B" == "false" && "$DRAINING_A" == "true" ]]; then
    ACTIVE_SERVICE="sfu-b"
    ACTIVE_URL="$SFU_B_URL"
  else
    ACTIVE_SERVICE="sfu-a"
    ACTIVE_URL="$SFU_A_URL"
  fi
elif [[ -n "$STATUS_A" ]]; then
  ACTIVE_SERVICE="sfu-a"
  ACTIVE_URL="$SFU_A_URL"
elif [[ -n "$STATUS_B" ]]; then
  ACTIVE_SERVICE="sfu-b"
  ACTIVE_URL="$SFU_B_URL"
else
  ACTIVE_SERVICE="sfu-a"
  ACTIVE_URL="$SFU_A_URL"
fi

if [[ "$ACTIVE_SERVICE" == "sfu-a" ]]; then
  INACTIVE_SERVICE="sfu-b"
  INACTIVE_URL="$SFU_B_URL"
else
  INACTIVE_SERVICE="sfu-a"
  INACTIVE_URL="$SFU_A_URL"
fi

echo "Active service: ${ACTIVE_SERVICE}"
echo "Inactive service: ${INACTIVE_SERVICE}"

echo "Building and starting ${INACTIVE_SERVICE}..."
"${COMPOSE[@]}" up -d --build "$INACTIVE_SERVICE"

if [[ -n "$ACTIVE_URL" ]]; then
  echo "Draining ${ACTIVE_SERVICE}..."
  curl -fsS -X POST "${ACTIVE_URL}/drain" \
    -H "x-sfu-secret: ${SFU_SECRET}" \
    -H "content-type: application/json" \
    -d '{"draining": true}' >/dev/null
fi

DRAIN_TIMEOUT_SECONDS="${DRAIN_TIMEOUT_SECONDS:-3600}"
DRAIN_POLL_SECONDS="${DRAIN_POLL_SECONDS:-10}"

if [[ -n "$ACTIVE_URL" ]]; then
  echo "Waiting for ${ACTIVE_SERVICE} rooms to drain..."
  start_ts="$(date +%s)"
  while true; do
    status="$(status_json "$ACTIVE_URL")"
    rooms="0"
    if [[ -n "$status" ]]; then
      rooms="$(printf "%s" "$status" | json_field rooms || echo "0")"
    fi
    echo "Active rooms: ${rooms}"
    if [[ "$rooms" == "0" ]]; then
      break
    fi
    now_ts="$(date +%s)"
    if (( now_ts - start_ts > DRAIN_TIMEOUT_SECONDS )); then
      echo "Timed out waiting for rooms to drain." >&2
      exit 1
    fi
    sleep "$DRAIN_POLL_SECONDS"
  done
fi

echo "Rebuilding and starting ${ACTIVE_SERVICE}..."
"${COMPOSE[@]}" up -d --build "$ACTIVE_SERVICE"

echo "SFU deploy complete."
