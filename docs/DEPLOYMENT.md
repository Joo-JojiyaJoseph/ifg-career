# Deploying Infolks Group Careers

Production is a Linux VPS or a cPanel host with Nginx or Apache and PHP-FPM. There is no Docker.

Domains that share the parent cookie:

- `api.infolksgroup.com` → `career-backend/public`
- `careers.infolksgroup.com` → `career-frontend/dist/careers`
- `hr.infolksgroup.com` → `career-frontend/dist/portal`

Set `SESSION_DOMAIN=.infolksgroup.com`, `SESSION_SECURE_COOKIE=true`, `SANCTUM_STATEFUL_DOMAINS=careers.infolksgroup.com,hr.infolksgroup.com`, and the two `FRONTEND_*_URL` values to the https origins. `APP_URL` is the API origin.

Build the frontends with `npm run build` after setting `VITE_API_URL=https://api.infolksgroup.com`.

## Queue and schedule

Supervisor (or a cPanel cron that stays running) for the worker:

```
php /var/www/career-backend/artisan queue:work --sleep=1 --tries=3 --max-time=3600
```

Cron:

```
* * * * * php /var/www/career-backend/artisan schedule:run >> /dev/null 2>&1
```

Back up the MySQL database and `storage/app/private` daily. Files are private and are served only through signed URLs.

Mail in production is SMTP or SES. Publish SPF, DKIM and DMARC for `infolksgroup.com`.

## Nginx

```nginx
server {
    listen 443 ssl;
    server_name api.infolksgroup.com;
    root /var/www/career-backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }
}

server {
    listen 443 ssl;
    server_name careers.infolksgroup.com;
    root /var/www/career-frontend/dist/careers;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 443 ssl;
    server_name hr.infolksgroup.com;
    root /var/www/career-frontend/dist/portal;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Apache

API vhost, document root `career-backend/public`, `AllowOverride All` so Laravel's `.htaccess` front-controller runs.

Each frontend vhost:

```apache
DocumentRoot /var/www/career-frontend/dist/careers
FallbackResource /index.html
```

Use `dist/portal` for the HR host. Require TLS on all three vhosts.
