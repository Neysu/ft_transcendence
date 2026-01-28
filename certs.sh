#!/bin/sh

certs_dir="/etc/nginx/certs"
if [ ! -d "$certs_dir" ]; then
	mkdir "$certs_dir"
fi

if [ ! -f "$certs_dir/cert.pem" ] || [ ! -f "$certs_dir/key.pem" ]; then
	echo "Generating self-signed SSL certs for front"

	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$certs_dir/keys.pem" \
        -out "$certs_dir/certs.pem" \
        -subj "/CN=${HOST}" \
        -addext "subjectAltName=DNS:${HOST},DNS:localhost,IP:127.0.0.1"

    chmod 644 "$certs_dir/certs.pem"
    chmod 600 "$certs_dir/keys.pem"

	echo "SSL certs generated successfully"
else
	echo "SSL certs already exist skipping"
fi

exec "$@"
