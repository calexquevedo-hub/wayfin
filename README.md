# WayFin - Gestão

Plataforma web para gestão financeira e operacional, com módulos de:

- contas a pagar e receber
- contratos e clientes
- conciliação bancária
- colaboradores e adesão de planos
- relatórios e dashboard executivo

## Arquitetura

- `client/`: frontend React + Vite + TypeScript
- `server/`: API Node.js + Express + TypeScript
- Banco: MongoDB (Atlas ou local)

## Stack Técnica

- Frontend: React, Vite, TypeScript, Tailwind CSS, Axios
- Backend: Express, Mongoose, JWT, Multer
- Deploy recomendado: Render (frontend + backend) + Atlas M0

## Funcionalidades

- Login com autorização por perfil/permissões
- Dashboard com métricas de receita/despesa e saldo
- Gestão de transações, categorias e contas bancárias
- Gestão de contratos e clientes
- Gestão de colaboradores, planos e adesões
- Conciliação bancária por arquivo OFX
- Exportações de relatório em CSV, PDF e Excel
- Configuração de usuário:
  - nome
  - e-mail com confirmação
  - troca de senha
  - foto de perfil com recorte circular

## Estrutura de Pastas

```text
WayFin/
├── client/
├── server/
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

## Rodar Local (Sem Docker)

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

### 3. Endpoints locais

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check API: `http://localhost:5000/api/health`

## Build

### Backend

```bash
cd server
npm run build
```

### Frontend

```bash
cd client
npm run build
```

## Deploy

### Render + Atlas (fluxo atual)

Guia completo:

- `DEPLOY_RENDER_ATLAS.md`

Configuração esperada:

- Frontend (`wayfin`): `https://wayfin.onrender.com`
- Backend (`wayfin-api`): `https://wayfin-api.onrender.com`
- Frontend env: `VITE_API_URL=https://wayfin-api.onrender.com/api`
- Backend env: `CORS_ORIGIN=https://wayfin.onrender.com`

### Oracle Always Free + Docker

Guia completo:

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

## Scripts Operacionais

- `seed-atlas-admin.sh`  
  Cria/atualiza admin no Atlas.
- `create-docker-admin.sh`  
  Cria admin em ambiente Docker.
- `fix-admin.sh`  
  Reexecuta seed local.

## Segurança

- Use `JWT_SECRET` forte em produção
- Restrinja `CORS_ORIGIN` ao domínio real do frontend
- Não comite segredos reais em `git`
- Restrinja rede no Atlas (evite `0.0.0.0/0` em produção)
- Mantenha dependências atualizadas (`npm audit`)

## Troubleshooting Rápido

- API no ar:
  - `https://wayfin-api.onrender.com/api/health`
- Se login falhar:
  - valide `MONGODB_URI` no backend
  - valide `VITE_API_URL` no frontend
  - rode `seed-atlas-admin.sh` para recriar admin
- Se aba do navegador mostrar título incorreto:
  - conferir `client/index.html` (`WayFin - Gestão`)

## Licença

MIT. Consulte `LICENSE`.
