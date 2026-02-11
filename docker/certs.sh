#!/bin/sh

certs_dir="/etc/nginx/certs"
mkdir -p "$certs_dir"

# Generate self-signed certs if they don't exist
if [ ! -f "$certs_dir/certs.crt" ] || [ ! -f "$certs_dir/keys.key" ]; then
    echo "Generating self-signed SSL certs for Nginx"
    : "${HOST:=ft_trans.localhost}"  # default if HOST not set

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$certs_dir/keys.key" \
        -out "$certs_dir/certs.crt" \
        -subj "/CN=${HOST}" \
        -addext "subjectAltName=DNS:${HOST},DNS:localhost,IP:127.0.0.1"

    chmod 644 "$certs_dir/certs.crt"
    chmod 600 "$certs_dir/keys.key"

    echo "SSL certs generated successfully"
else
    echo "SSL certs already exist, skipping"
fi

exec "$@"
