FROM alpine:3.20
RUN apk add --no-cache tinyproxy dos2unix
COPY tinyproxy.conf /etc/tinyproxy/tinyproxy.conf
RUN dos2unix /etc/tinyproxy/tinyproxy.conf
EXPOSE 8888
CMD ["tinyproxy", "-d"]
