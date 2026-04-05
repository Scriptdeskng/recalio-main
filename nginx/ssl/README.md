# Nginx SSL certificates directory
# Place your SSL certificates here for HTTPS support

# Example structure:
# ssl/
#   ├── cert.pem     # Your SSL certificate
#   └── key.pem      # Your SSL private key

# For Let's Encrypt certificates, you might link them here:
# ln -s /etc/letsencrypt/live/yourdomain.com/fullchain.pem cert.pem
# ln -s /etc/letsencrypt/live/yourdomain.com/privkey.pem key.pem

# Self-signed certificate for testing (DO NOT USE IN PRODUCTION):
# openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#   -keyout key.pem -out cert.pem \
#   -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
