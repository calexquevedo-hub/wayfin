#!/bin/bash
echo "📦 Configurando MongoDB Local..."

# Criar pastas locais
mkdir -p .mongo/data
mkdir -p .mongo/log

# Copiar binários do Downloads
SOURCE_DIR="/Users/alexandrequevedo/Downloads/mongodb-macos-aarch64--8.2.4/bin"

if [ -d "$SOURCE_DIR" ]; then
    cp -r "$SOURCE_DIR" .mongo/
    chmod +x .mongo/bin/*
    echo "✅ MongoDB copiado para a pasta do projeto."
else
    echo "❌ Erro: Não encontrei a pasta do MongoDB em Downloads."
    echo "Verifique se a pasta '$SOURCE_DIR' existe."
    exit 1
fi
