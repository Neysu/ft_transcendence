FROM nginx:alpine

COPY ./nginx.conf /etc/nginx/nginx.conf

RUN apk add --no-cache openssl

COPY certs.sh /usr/local/bin/certs.sh
RUN chmod +x /usr/local/bin/certs.sh

ENTRYPOINT [ "/usr/local/bin/certs.sh" ]
CMD [ "nginx", "-g", "daemon off;" ]
