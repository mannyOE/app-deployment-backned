FROM node:12.18.3-alpine3.9 AS BUILD_IMAGE

LABEL MAINTAINER="Chuka"
LABEL application="Zeedas Config Service - Backend"

RUN apk update && apk upgrade && apk add --no-cache bash git openssh
RUN mkdir -p /home/node/config/node_modules && chown -R node:node /home/node/config

WORKDIR /home/node/config

COPY package*.json ./

USER node

RUN rm -rf ./dist && npm install

COPY --chown=node:node . .

RUN npx tsc && cp -r ./src/rpc/pb ./dist/rpc/ && rm -rf ./node_modules/ && npm i --only=prod

FROM node:12.18.3-alpine3.9

WORKDIR /home/node/config

COPY --from=BUILD_IMAGE /home/node/config .

EXPOSE 3240
EXPOSE 40001 40002 40003