# KostKu deployment runbook

## Docker Compose

```bash
cp .env.production.example .env.production
# edit .env.production: AUTH_SECRET, OWNER_USERNAME, OWNER_PASSWORD
chmod 600 .env.production
openssl rand -base64 32

docker compose up -d --build
docker compose ps
curl -i http://127.0.0.1:3000/api/auth/me
```

The health check expects `401` from `/api/auth/me` without a cookie. Put a TLS reverse proxy in front of the localhost-bound port. Never publish the app port directly.

## systemd

```bash
sudo useradd --system --home /opt/kostku --shell /usr/sbin/nologin kostku
sudo install -d -o kostku -g kostku -m 750 /opt/kostku /var/lib/kostku /var/backups/kostku
sudo cp -a . /opt/kostku/
sudo cp .env.production /opt/kostku/.env.production
sudo chown -R kostku:kostku /opt/kostku /var/lib/kostku /var/backups/kostku
sudo chmod 600 /opt/kostku/.env.production
sudo -u kostku npm ci --prefix /opt/kostku
sudo -u kostku npm run rebuild-native --prefix /opt/kostku
sudo -u kostku npm run build --prefix /opt/kostku
sudo cp deploy/kostku.service /etc/systemd/system/kostku.service
sudo systemctl daemon-reload
sudo systemctl enable --now kostku
sudo systemctl status kostku
```

## Scheduled backup

Run as the application user at least once per day:

```cron
15 2 * * * cd /opt/kostku && KOSTKU_DB_PATH=/var/lib/kostku/kostku.db KOSTKU_BACKUP_DIR=/var/backups/kostku /usr/bin/npm run backup >> /var/log/kostku-backup.log 2>&1
```

Copy `/var/backups/kostku` to separate encrypted storage. A local backup alone is not disaster recovery.
