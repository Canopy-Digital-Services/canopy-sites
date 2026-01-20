# Can-O-Forms Deployment Guide

This guide covers deploying Can-O-Forms to various environments.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (can use the included docker-compose setup)
- SMTP credentials (Migadu or other provider)
- Domain name (optional, for production)

## Quick Start with Docker Compose

### 1. Clone and Configure

```bash
cd /path/to/can-o-forms
cp .env.example .env
```

### 2. Edit `.env` file

Update the following values:

```env
DATABASE_URL="postgresql://user:password@postgres:5432/canoforms?schema=public"
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="https://forms.yourdomain.com"

SMTP_HOST="smtp.migadu.com"
SMTP_PORT="587"
SMTP_USER="your-email@yourdomain.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Can-O-Forms <noreply@yourdomain.com>"

ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your-secure-password"
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Run Database Migrations

```bash
docker-compose exec can-o-forms npx prisma migrate deploy
```

### 5. Seed Admin User

```bash
docker-compose exec can-o-forms npm run db:seed
```

### 6. Access the Application

Open `http://localhost:3000` and log in with your admin credentials.

## Production Deployment (Coolify)

### 1. Create New Service in Coolify

- Type: Docker Compose
- Repository: Link your GitHub repository
- Branch: `main`

### 2. Environment Variables

Add all environment variables from `.env.example` in Coolify's environment settings.

**Important:** Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Database Setup

Option A: Use existing PostgreSQL server
- Update `DATABASE_URL` to point to your PostgreSQL instance

Option B: Deploy PostgreSQL via Coolify
- Create a separate PostgreSQL service in Coolify
- Link it to Can-O-Forms via `DATABASE_URL`

### 4. Domain Configuration

- Add your domain in Coolify (e.g., `forms.yourdomain.com`)
- Update `NEXTAUTH_URL` to match your domain
- Enable HTTPS (Coolify handles SSL automatically)

### 5. Deploy

Click "Deploy" in Coolify. The build process will:
1. Build the Docker image
2. Start the container
3. Run migrations automatically on first start

### 6. Initialize Database

After first deployment:

```bash
# SSH into your server
ssh user@yourserver.com

# Run seed command
docker exec can-o-forms npm run db:seed
```

## Manual Docker Deployment

### Build Image

```bash
docker build -t can-o-forms:latest .
```

### Run Container

```bash
docker run -d \
  --name can-o-forms \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://..." \
  -e SMTP_HOST="..." \
  -e SMTP_PORT="587" \
  -e SMTP_USER="..." \
  -e SMTP_PASS="..." \
  -e SMTP_FROM="..." \
  can-o-forms:latest
```

### Run Migrations

```bash
docker exec can-o-forms npx prisma migrate deploy
```

### Seed Database

```bash
docker exec can-o-forms npm run db:seed
```

## Reverse Proxy Configuration

### Caddy

```caddyfile
forms.yourdomain.com {
    reverse_proxy can-o-forms:3000
}
```

### Nginx

```nginx
server {
    listen 80;
    server_name forms.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database Backups

### Manual Backup

```bash
docker exec can-o-forms-db pg_dump -U user canoforms > backup.sql
```

### Automated Backups

Add to crontab:

```bash
0 2 * * * docker exec can-o-forms-db pg_dump -U user canoforms > /backups/canoforms-$(date +\%Y\%m\%d).sql
```

## Maintenance

### View Logs

```bash
docker-compose logs -f can-o-forms
```

### Update Application

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Run Migrations After Update

```bash
docker-compose exec can-o-forms npx prisma migrate deploy
```

## Troubleshooting

### Can't Connect to Database

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

### Email Notifications Not Working

- Verify SMTP credentials
- Check SMTP host and port
- Test with: `docker-compose exec can-o-forms node -e "require('./dist/lib/email').sendSubmissionNotification(...)"`

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is set
- Clear browser cookies
- Check `NEXTAUTH_URL` matches your domain

### Migration Errors

If migrations fail:

```bash
# Reset database (WARNING: deletes all data)
docker-compose exec can-o-forms npx prisma migrate reset

# Or manually fix:
docker-compose exec can-o-forms npx prisma migrate resolve --rolled-back [migration-name]
```

## Security Recommendations

1. **Use strong passwords** for all accounts and secrets
2. **Enable HTTPS** in production (required for NextAuth)
3. **Restrict database access** to application only
4. **Regular backups** of database
5. **Keep dependencies updated**: `npm audit fix`
6. **Monitor logs** for suspicious activity
7. **Rate limiting** is built-in but consider adding at reverse proxy level

## Performance Optimization

1. **PostgreSQL tuning** for your workload
2. **Enable caching** at reverse proxy level
3. **Monitor resource usage**: `docker stats`
4. **Scale horizontally** if needed (multiple containers behind load balancer)

## Support

For issues or questions:
- GitHub: https://github.com/Skinnerbox916/Can-O-Forms
- Review logs for error details
- Check PRD.md for feature documentation
