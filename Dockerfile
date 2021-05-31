FROM alpine:latest

RUN apk add --no-cache nodejs npm
RUN echo "Africa/Lagos" > /etc/timezone

WORKDIR /home/app

COPY package.json /home/app
COPY package-lock.json /home/app

RUN npm install

COPY . /home/app

RUN npm run clean

RUN npm run build

RUN npm run prestart

CMD ["node", "dist/"]

EXPOSE 3103
