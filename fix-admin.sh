#!/bin/bash
# Script para forçar a criação do usuário Admin
export PATH=$PWD/.tools/node-v20.11.0-darwin-arm64/bin:$PATH
export npm_config_cache=$PWD/.npm-cache

echo "🌱 Semeando banco de dados..."
cd server
export MONGO_URI="mongodb://127.0.0.1:27017/wayfin"
npx ts-node src/seed.ts
echo "✅ Script finalizado."
