# Deploy — WeCare Parceiros (Jarvis VPS)

Guia de deploy para Ubuntu 22.04 no servidor Jarvis.

**Domínio:** `parceiros.wecarehosting.com.br`  
**Frontend:** porta `3001` (Next.js standalone)  
**Backend:** porta `18790` (FastAPI + uvicorn)

---

## 1. Pré-requisitos no servidor

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx certbot python3-certbot-nginx

# Node.js 20 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# uv (gerenciador Python)
curl -LsSf https://astral.sh/uv/install.sh | sh
# Reinicie o shell ou: source ~/.local/bin/env
```

Crie o diretório de apps (se ainda não existir):

```bash
sudo mkdir -p /home/jarvis/apps
sudo chown jarvis:jarvis /home/jarvis/apps
```

---

## 2. Clone do repositório

```bash
cd /home/jarvis/apps
git clone <URL_DO_REPOSITORIO> wecare-parceiros
cd wecare-parceiros
```

---

## 3. Backend

### 3.1 Dependências e ambiente

```bash
cd /home/jarvis/apps/wecare-parceiros/backend

# Instalar dependências (inclui psycopg2 para produção)
uv sync --extra prod

# Criar arquivo de ambiente
cp ../.env.example .env
nano .env
```

Variáveis mínimas para produção:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/wecare_parceiros
SECRET_KEY=<gere-uma-chave-forte>
TOKEN_EXPIRE_HOURS=8
RESEND_API_KEY=<sua-chave-resend>
FROM_EMAIL=WeCare Parceiros <parceiros@wecarehosting.com.br>
FRONTEND_URL=https://parceiros.wecarehosting.com.br
CORS_ORIGINS=https://parceiros.wecarehosting.com.br
UPLOADS_DIR=/home/jarvis/apps/wecare-parceiros/backend/uploads
BOOTSTRAP_TOKEN=<token-seguro-para-criar-admin>
```

```bash
mkdir -p uploads
```

### 3.2 Migrations (Alembic)

```bash
uv run alembic upgrade head
```

### 3.3 Criar usuário admin (opcional)

```bash
uv run python scripts/create_admin.py
# ou use o endpoint de bootstrap com BOOTSTRAP_TOKEN
```

---

## 4. Frontend

### 4.1 Build

```bash
cd /home/jarvis/apps/wecare-parceiros/frontend

# Variável de API apontando para o proxy nginx
echo 'NEXT_PUBLIC_API_URL=https://parceiros.wecarehosting.com.br/api/v1' > .env.production.local

npm ci
npm run build
```

O build gera o bundle standalone em `.next/standalone/`. O serviço systemd espera `server.js` na raiz do frontend — copie o bundle:

```bash
cp .next/standalone/server.js .
cp -r .next/standalone/.next .next-runtime
# Alternativa recomendada: ajuste WorkingDirectory no serviço para
# /home/jarvis/apps/wecare-parceiros/frontend/.next/standalone
```

> **Nota:** Se preferir não copiar arquivos, edite `wecare-parceiros-frontend.service` e defina:
> `WorkingDirectory=/home/jarvis/apps/wecare-parceiros/frontend/.next/standalone`

---

## 5. Nginx

```bash
sudo cp /home/jarvis/apps/wecare-parceiros/deploy/nginx/parceiros.wecarehosting.com.br.conf \
  /etc/nginx/sites-available/parceiros.wecarehosting.com.br

sudo ln -sf /etc/nginx/sites-available/parceiros.wecarehosting.com.br \
  /etc/nginx/sites-enabled/

sudo nginx -t
sudo systemctl reload nginx
```

Certifique-se de que o DNS de `parceiros.wecarehosting.com.br` aponta para o IP do VPS antes de emitir o SSL.

---

## 6. Systemd

```bash
sudo cp /home/jarvis/apps/wecare-parceiros/deploy/systemd/wecare-parceiros-backend.service \
  /etc/systemd/system/
sudo cp /home/jarvis/apps/wecare-parceiros/deploy/systemd/wecare-parceiros-frontend.service \
  /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable wecare-parceiros-backend wecare-parceiros-frontend
sudo systemctl start wecare-parceiros-backend wecare-parceiros-frontend
```

Verificar status:

```bash
sudo systemctl status wecare-parceiros-backend
sudo systemctl status wecare-parceiros-frontend
journalctl -u wecare-parceiros-backend -f
journalctl -u wecare-parceiros-frontend -f
```

---

## 7. SSL com Certbot

Com o nginx servindo HTTP e o DNS propagado:

```bash
sudo certbot --nginx -d parceiros.wecarehosting.com.br
```

O certbot irá:
- Emitir o certificado Let's Encrypt
- Inserir o bloco `listen 443 ssl` no arquivo de configuração
- Configurar redirecionamento HTTP → HTTPS

Renovação automática (já configurada pelo certbot):

```bash
sudo certbot renew --dry-run
```

---

## 8. Atualização (deploy subsequente)

```bash
cd /home/jarvis/apps/wecare-parceiros
git pull

# Backend
cd backend
uv sync --extra prod
uv run alembic upgrade head
sudo systemctl restart wecare-parceiros-backend

# Frontend
cd ../frontend
npm ci
npm run build
# Recopiar server.js se necessário (ver seção 4.1)
sudo systemctl restart wecare-parceiros-frontend
```

---

## 9. Checklist rápido

- [ ] PostgreSQL rodando e `DATABASE_URL` configurado
- [ ] `.env` do backend preenchido
- [ ] `alembic upgrade head` executado
- [ ] `NEXT_PUBLIC_API_URL` apontando para `/api/v1` no domínio de produção
- [ ] Serviços systemd ativos (`backend` na 18790, `frontend` na 3001)
- [ ] Nginx proxyando `/` → 3001 e `/api/` → 18790
- [ ] Certbot emitiu SSL e HTTPS funcionando
