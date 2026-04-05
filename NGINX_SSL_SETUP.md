# Nginx & SSL Setup Guide for Ubuntu 24.04

Complete guide to set up Nginx as a reverse proxy with SSL/TLS certificates for Recallio.

---

## Prerequisites

- Ubuntu 24.04 server with sudo privileges
- Domain name pointed to your server's IP address
- Docker and Docker Compose installed
- Recallio services running via `docker-compose.prod.yml`

---

## Step 1: Install Nginx

```bash
# Update package list
sudo apt update

# Install nginx
sudo apt install nginx -y

# Check nginx status
sudo systemctl status nginx

# Enable nginx to start on boot
sudo systemctl enable nginx
```

**Verify Installation:**
```bash
nginx -v
# Should output: nginx version: nginx/1.24.x
```

---

## Step 2: Configure Firewall

```bash
# Allow SSH (if not already allowed)
sudo ufw allow 'OpenSSH'

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

---

## Step 3: Create Nginx Configuration for Recallio

### 3.1 Remove Default Configuration

```bash
# Remove default nginx site
sudo rm /etc/nginx/sites-enabled/default
```

### 3.2 Create Recallio Configuration

Replace `your-domain.com` with your actual domain:

```bash
sudo nano /etc/nginx/sites-available/recallio
```

**Add this configuration:**

```nginx
# Upstream definitions
upstream recallio_api {
    server localhost:8000;
    keepalive 32;
}

upstream recallio_web {
    server localhost:3000;
    keepalive 32;
}

# Redirect HTTP to HTTPS (will be enabled after SSL setup)
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Temporary: serve the app until SSL is set up
    location / {
        proxy_pass http://recallio_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API routes
    location /api/ {
        proxy_pass http://recallio_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://recallio_api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}
```

### 3.3 Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/recallio /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 4: Install SSL Certificate with Let's Encrypt

### 4.1 Install Certbot

```bash
# Install certbot and nginx plugin
sudo apt install certbot python3-certbot-nginx -y
```

### 4.2 Obtain SSL Certificate

Replace `your-domain.com` with your actual domain:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Follow the prompts:**
1. Enter your email address
2. Agree to Terms of Service
3. Choose whether to share email with EFF
4. **Important:** Select option `2` to redirect HTTP to HTTPS

Certbot will automatically:
- Obtain the certificate
- Update your nginx configuration
- Set up auto-renewal

### 4.3 Verify SSL Certificate

```bash
# Check certificate status
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 5: Update Nginx Configuration for Production

After SSL is installed, update your nginx config for better security:

```bash
sudo nano /etc/nginx/sites-available/recallio
```

**Replace with this production-ready configuration:**

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=web_limit:10m rate=30r/s;

# Upstream definitions
upstream recallio_api {
    server localhost:8000;
    keepalive 32;
}

upstream recallio_web {
    server localhost:3000;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/recallio_access.log;
    error_log /var/log/nginx/recallio_error.log;

    # Max upload size (for quiz images, etc.)
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
    gzip_disable "msie6";

    # Frontend (Next.js)
    location / {
        limit_req zone=web_limit burst=20 nodelay;
        
        proxy_pass http://recallio_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_buffering off;
    }

    # API Routes
    location /api/ {
        limit_req zone=api_limit burst=10 nodelay;
        
        proxy_pass http://recallio_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://recallio_api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Static files caching (Next.js _next folder)
    location /_next/static/ {
        proxy_pass http://recallio_web;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # Block access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

**Test and reload:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: Set Up Auto-Renewal for SSL Certificates

### 6.1 Verify Renewal Timer

```bash
# Check certbot timer status
sudo systemctl status certbot.timer

# List all timers
sudo systemctl list-timers | grep certbot
```

### 6.2 Test Renewal Process

```bash
# Dry run to test renewal
sudo certbot renew --dry-run
```

If successful, certbot will automatically renew certificates before they expire.

---

## Step 7: Update Docker Compose Environment

Update your production environment variables:

```bash
nano /path/to/recallio/.env.production
```

Add:
```env
# Frontend API URL (will be served through nginx)
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com
```

Update `docker-compose.prod.yml` web service:
```yaml
web:
  environment:
    NODE_ENV: production
    NEXT_PUBLIC_API_BASE_URL: https://${DOMAIN_NAME}
```

---

## Step 8: Security Hardening

### 8.1 Update Nginx Base Configuration

```bash
sudo nano /etc/nginx/nginx.conf
```

**Ensure these settings exist in the `http` block:**

```nginx
http {
    # Hide nginx version
    server_tokens off;
    
    # Buffer size limits
    client_body_buffer_size 1K;
    client_header_buffer_size 1k;
    client_max_body_size 10M;
    large_client_header_buffers 2 1k;
    
    # Timeouts
    client_body_timeout 10;
    client_header_timeout 10;
    keepalive_timeout 65;
    send_timeout 10;
    
    # ... rest of config
}
```

### 8.2 Set Up Fail2Ban (Optional but Recommended)

```bash
# Install fail2ban
sudo apt install fail2ban -y

# Create nginx jail
sudo nano /etc/fail2ban/jail.d/nginx.conf
```

Add:
```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/recallio_error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/recallio_access.log

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/recallio_access.log

[nginx-req-limit]
enabled = true
port = http,https
logpath = /var/log/nginx/recallio_error.log
```

Restart fail2ban:
```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

---

## Step 9: Monitoring & Logs

### View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/recallio_access.log

# Error logs
sudo tail -f /var/log/nginx/recallio_error.log

# All nginx errors
sudo tail -f /var/log/nginx/error.log
```

### Check Nginx Status

```bash
# Service status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View active connections
sudo nginx -V 2>&1 | grep --color=always status
```

---

## Step 10: Final Verification

### 10.1 Test SSL Configuration

Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

Target: **A+ rating**

### 10.2 Test HTTP/2

```bash
curl -I -k --http2 https://your-domain.com
```

Should show: `HTTP/2 200`

### 10.3 Test Application

```bash
# Test API
curl https://your-domain.com/health

# Test Frontend
curl -I https://your-domain.com
```

### 10.4 Test from Browser

1. Visit `https://your-domain.com`
2. Check for padlock icon in address bar
3. Verify certificate details
4. Test quiz generation and authentication

---

## Common Issues & Solutions

### Issue 1: 502 Bad Gateway

**Cause:** Docker containers not running or ports not accessible

**Solution:**
```bash
# Check Docker containers
docker ps

# Restart containers
docker-compose -f docker-compose.prod.yml restart

# Check nginx error logs
sudo tail -f /var/log/nginx/recallio_error.log
```

### Issue 2: Certificate Renewal Fails

**Cause:** Nginx blocking Let's Encrypt validation

**Solution:**
```bash
# Temporarily stop nginx
sudo systemctl stop nginx

# Renew certificate
sudo certbot renew

# Start nginx
sudo systemctl start nginx
```

### Issue 3: CORS Errors

**Cause:** API not recognizing requests from domain

**Solution:**
Update FastAPI CORS settings in `apps/api/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 4: WebSocket Connection Issues

**Cause:** Nginx not properly handling WebSocket upgrades

**Solution:**
Already configured in the setup above with:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

---

## Maintenance Commands

### Restart Services

```bash
# Restart nginx
sudo systemctl restart nginx

# Reload nginx (zero downtime)
sudo systemctl reload nginx

# Restart application
cd /path/to/recallio
docker-compose -f docker-compose.prod.yml restart
```

### Update SSL Certificate Manually

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Check Resource Usage

```bash
# Check nginx processes
ps aux | grep nginx

# Check connections
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

---

## Production Checklist

Before going live:

- [ ] Domain DNS A record points to server IP
- [ ] Firewall configured (UFW)
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained and installed
- [ ] HTTP to HTTPS redirect working
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Fail2ban configured (optional)
- [ ] Logs rotation configured
- [ ] Backup strategy for SSL certificates
- [ ] Environment variables updated
- [ ] CORS settings verified
- [ ] SSL rating A+ on SSL Labs
- [ ] Application tested end-to-end
- [ ] Monitoring set up (optional: Prometheus, Grafana)

---

## Additional Resources

- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **SSL Labs Test:** https://www.ssllabs.com/ssltest/
- **Mozilla SSL Config Generator:** https://ssl-config.mozilla.org/

---

## Quick Reference

### Important File Locations

```
/etc/nginx/nginx.conf                  # Main nginx config
/etc/nginx/sites-available/recallio    # Your site config
/etc/nginx/sites-enabled/recallio      # Symlink to enabled site
/var/log/nginx/                        # Nginx logs
/etc/letsencrypt/                      # SSL certificates
/var/www/html/                         # Web root (for Let's Encrypt)
```

### Important Commands

```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/recallio_error.log

# Renew SSL
sudo certbot renew

# Check SSL status
sudo certbot certificates
```

---

**Setup Complete!** 🎉

Your Recallio application is now running behind Nginx with SSL/TLS encryption on Ubuntu 24.04.
