# Deploy no Oracle Always Free (Docker)

Este guia sobe o WayFin em uma VM Oracle Always Free usando Docker Compose.

## 1. Criar VM Always Free

No painel Oracle Cloud:

1. Compute -> Instances -> Create instance
2. Image: **Ubuntu 22.04**
3. Shape: **VM.Standard.E2.1.Micro** (Always Free)
4. Gere/importe sua chave SSH
5. Em Networking, deixe IP público habilitado

## 2. Abrir portas na Oracle (Security List / NSG)

Libere somente:

- TCP `22` (SSH)
- TCP `80` (app)

Nao abra `5000`, `5001` ou `27017`.

## 3. Preparar servidor

Conecte por SSH:

```bash
ssh -i /caminho/sua-chave.pem ubuntu@SEU_IP_PUBLICO
```

Instale Docker + Compose plugin:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 4. Subir o projeto

No seu computador local:

```bash
scp -i /caminho/sua-chave.pem -r "/Users/alexandrequevedo/Library/CloudStorage/GoogleDrive-alexandre@loreway.com.br/Meu Drive/Apps/WayFin" ubuntu@SEU_IP_PUBLICO:~/wayfin
```

Na VM:

```bash
cd ~/wayfin
cp server/.env.oracle.example server/.env.oracle
```

Edite `server/.env.oracle`:

- `JWT_SECRET` com valor forte
- `CORS_ORIGIN=http://SEU_IP_PUBLICO`

Suba containers:

```bash
docker compose -f docker-compose.yml -f docker-compose.oracle.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.oracle.yml ps
docker compose -f docker-compose.yml -f docker-compose.oracle.yml logs -f
```

App: `http://SEU_IP_PUBLICO`

## 5. Criar/validar usuario admin

Dentro da VM:

```bash
./create-docker-admin.sh
```

Credencial atual do script:

- Email: `admin@wayfin.com`
- Senha: `admin123`

## 6. Atualizar versao (deploy continuo manual)

Depois de enviar novas alteracoes:

```bash
cd ~/wayfin
docker compose -f docker-compose.yml -f docker-compose.oracle.yml up -d --build
```

## 7. Backup do banco

```bash
docker compose -f docker-compose.yml -f docker-compose.oracle.yml exec mongodb \
  mongodump --archive=/data/db/backup-$(date +%F).archive
```

