FROM denoland/deno:alpine-2.1.4

WORKDIR /app

COPY honeypot.ts .

RUN addgroup -g 1001 -S honeypot && \
    adduser -S -D -H -u 1001 -s /sbin/nologin honeypot

USER honeypot

EXPOSE 21 22 23 25 53 80 110 143 443 993 995 1433 1521 3306 3389 5432 5900 6379 8080 8443

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-sys","honeypot.ts"]