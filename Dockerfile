FROM node:alpine

COPY . /usr/src/app

RUN cd /usr/src/app \
 && npm install
