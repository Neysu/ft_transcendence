FROM nginx:alpine

RUN apk add --no-cache openssl

COPY certs.sh /usr/local/bin/certs.sh
RUN chmod +x /usr/local/bin/certs.sh

EXPOSE 443

ENTRYPOINT [ "/usr/local/bin/certs.sh" ]
CMD [ "nginx", "-g", "daemon off;" ]
