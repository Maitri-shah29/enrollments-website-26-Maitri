FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ py3-setuptools

ENV PYTHON=/usr/bin/python3

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "start"]
