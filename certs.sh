#!/bin/sh

certs_dir="/etc/nginx/certs"

if [ ! -f "$certs_dir/cert.pem" ] || [ ! -f "$certs_dir/key.pem" ]; then
	echo "Generating self-signed SSL certs for front"

	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout "$certs_dir/key.pem" \
		-out "$certs_dir/cert.pem" \
		-subj "/CN${FRONTHEND_HOST}" \
		-addext "subjectAltName=DNS:${FRONTEND_HOST},DNS:localhost,IP:127.0.0.1"

    chmod 644 "$certs_dir/cert.pem"
    chmod 600 "$certs_dir/key.pem"

	echo "SSL certs generated successfully"
else
	echo "SSL certs already exist skipping"
fi
