#!/bin/bash
# Script para iniciar o cliente com as configurações corretas de ambiente
export PATH=$PWD/.tools/node-v20.11.0-darwin-arm64/bin:$PATH
export npm_config_cache=$PWD/.npm-cache

echo "Iniciando cliente WayFin..."
cd client
npm run dev
