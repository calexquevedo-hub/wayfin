# WayFin - Gestão Financeira e Benefícios

WayFin é uma plataforma web para gestão financeira empresarial, com foco em:

- contas a pagar e receber
- conciliação bancária
- contratos e clientes
- gestão de colaboradores e adesões de planos (saúde/odonto)
- dashboards e relatórios operacionais

## Visão Geral

O sistema é composto por:

- `client/`: frontend React + Vite + TypeScript
- `server/`: backend Node.js + Express + TypeScript
- MongoDB para persistência

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Axios
- Backend: Node.js, Express, TypeScript, Mongoose, JWT
- Banco: MongoDB (local via Docker ou Atlas)
- Deploy: Render (Web Service + Static Site) e Atlas M0

## Funcionalidades Principais

- Autenticação e autorização por perfil/permissão
- Dashboard financeiro com métricas e gráficos
- Gestão de:
  - transações
  - contas bancárias
  - categorias
  - contratos
  - clientes
  - colaboradores
  - planos de saúde e odontológicos
  - adesões
- Relatórios com exportação (CSV, PDF e Excel)
- Conciliação bancária com importação de OFX
- Configurações do usuário (perfil, senha, avatar)

## Estrutura do Projeto

```text
WayFin/
├── client/                    # Frontend
├── server/                    # Backend
├── docker-compose.yml
├── docker-compose.oracle.yml
├── DEPLOY_RENDER_ATLAS.md
├── DEPLOY_ORACLE_ALWAYS_FREE.md
└── README.Docker.md
```

## Requisitos

- Node.js 20+
- npm 10+
- MongoDB local ou Atlas

## Execução Local (Sem Docker)

1. Backend:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

2. Frontend:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

3. URLs locais:

- Frontend: `http://localhost:5173` (ou porta do Vite)
- Backend: `http://localhost:5000`

## Execução com Docker

Guia completo em:

- `README.Docker.md`

## Deploy

### Render + Atlas (recomendado para começar)

Siga:

- `DEPLOY_RENDER_ATLAS.md`

### Oracle Always Free + Docker

Siga:

- `DEPLOY_ORACLE_ALWAYS_FREE.md`

## Variáveis de Ambiente

### Backend (`server/.env`)

- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`

### Frontend (`client/.env`)

- `VITE_API_URL`

## Segurança

- Defina `JWT_SECRET` forte em produção
- Restrinja `CORS_ORIGIN` ao domínio do frontend
- Nunca comite segredos reais no repositório
- Restrinja IPs no Atlas em produção

## Qualidade e Build

Backend:

```bash
cd server
npm run build
```

Frontend:

```bash
cd client
npm run build
```

## Scripts Úteis

- `seed-atlas-admin.sh`: cria/atualiza usuário admin no Atlas
- `create-docker-admin.sh`: cria admin em ambiente Docker
- `fix-admin.sh`: reexecuta seed local

## Licença

Este projeto está sob a licença MIT. Consulte `LICENSE`.
