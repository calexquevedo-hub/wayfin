# Deploy no Render + MongoDB Atlas M0

Guia rapido para colocar o WayFin no ar com menor friccao.

## 1. Criar o banco no Atlas (M0)

1. Crie um cluster `M0` no Atlas.
2. Crie um usuario de banco (exemplo: `wayfin_user`).
3. Em `Network Access`, adicione acesso:
   `0.0.0.0/0` para inicio rapido (depois restrinja).
4. Copie a connection string SRV (`mongodb+srv://...`).
5. Troque `<password>` e use o banco `wayfin` no final da URI.

Exemplo:

```text
mongodb+srv://wayfin_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/wayfin?retryWrites=true&w=majority
```

## 2. Subir backend no Render (Web Service)

Crie um `Web Service` com o repositorio do projeto:

- Root Directory: `server`
- Runtime: `Node`
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Environment Variables:

- `NODE_ENV=production`
- `MONGODB_URI=<SUA_URI_ATLAS>`
- `JWT_SECRET=<SEGREDO_FORTE>`
- `CORS_ORIGIN=https://SEU-FRONTEND.onrender.com`

## 3. Subir frontend no Render (Static Site)

Crie um `Static Site`:

- Root Directory: `client`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`

Environment Variables:

- `VITE_API_URL=https://SEU-BACKEND.onrender.com/api`

## 4. Criar usuario admin no banco Atlas

Depois do backend no ar, rode localmente:

```bash
./seed-atlas-admin.sh "mongodb+srv://wayfin_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/wayfin?retryWrites=true&w=majority"
```

Credencial que o seed cria/atualiza:

- Email: `admin@admin.com`
- Senha: `admin123`

## 5. Teste final

1. Abra o frontend (`https://...onrender.com`)
2. Faça login com o admin
3. Se falhar, veja logs do backend no Render

## Observacoes

- Free Web Service do Render pode dormir apos inatividade.
- M0 e free tier sao para desenvolvimento/homologacao inicial.
