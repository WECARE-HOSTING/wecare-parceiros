# Certbot — Let's Encrypt

## Pré-requisito

```bash
sudo apt install certbot python3-certbot-nginx
```

## Emitir certificado

```bash
sudo certbot --nginx -d parceiros.wecarehosting.com.br
```

## Renovação automática

O certbot instala um timer systemd/cron automaticamente. Verificar:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```
