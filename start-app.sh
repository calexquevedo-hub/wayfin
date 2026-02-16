#!/bin/bash

# Configurar ambiente Node.js
export PATH=$PWD/.tools/node-v20.11.0-darwin-arm64/bin:$PATH
export npm_config_cache=$PWD/.npm-cache

echo "🚀 Iniciando WayFin (Full Stack)..."

# Função para matar os processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando aplicação..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    kill $MONGO_PID 2>/dev/null
    exit
}

trap cleanup SIGINT

# 1. Iniciar MongoDB Local
if [ -f ".mongo/bin/mongod" ]; then
    echo "🍃 Iniciando MongoDB Local..."
    ./.mongo/bin/mongod --dbpath .mongo/data --logpath .mongo/log/mongod.log --bind_ip 127.0.0.1 > /dev/null 2>&1 &
    MONGO_PID=$!
    echo "✅ MongoDB rodando (PID: $MONGO_PID)."
    
    # 1.1 Popular banco com usuário Admin (se necessário)
    echo "🌱 Verificando/Criando usuário Admin..."
    cd server
    export MONGO_URI="mongodb://127.0.0.1:27017/wayfin" 
    npx ts-node src/seed.ts > /dev/null 2>&1
    cd ..
else
    echo "⚠️  MongoDB Local não encontrado. Tentando conectar a um serviço global..."
fi

sleep 2

# 2. Iniciar Servidor (Backend)
echo "📡 Iniciando Servidor..."
cd server
npm run dev > ../server.log 2>&1 &
SERVER_PID=$!
cd ..
echo "✅ Servidor rodando (PID: $SERVER_PID)"

sleep 5

# 3. Iniciar Cliente (Frontend)
echo "💻 Iniciando Cliente..."
cd client
npm run dev > ../client.log 2>&1 &
CLIENT_PID=$!
cd ..
echo "✅ Cliente rodando (PID: $CLIENT_PID)"

echo ""
echo "🎉 APLICAÇÃO PRONTA!"
echo "👉 Acesse: http://localhost:5173"
echo ""
echo "Pressione Ctrl+C para encerrar tudo."

wait
