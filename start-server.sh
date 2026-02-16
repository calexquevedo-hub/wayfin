#!/bin/bash
# Script para iniciar o servidor com as configurações corretas de ambiente
export PATH=$PWD/.tools/node-v20.11.0-darwin-arm64/bin:$PATH
export npm_config_cache=$PWD/.npm-cache

echo "Iniciando servidor WayFin..."
cd server
npm run dev
