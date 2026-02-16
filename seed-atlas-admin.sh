#!/bin/bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Uso: ./seed-atlas-admin.sh \"MONGODB_URI\""
  exit 1
fi

MONGO_URI_INPUT="$1"

export PATH="$PWD/.tools/node-v20.11.0-darwin-arm64/bin:$PATH"
export npm_config_cache="$PWD/.npm-cache"

cd server
MONGO_URI="$MONGO_URI_INPUT" npx ts-node src/seed.ts
