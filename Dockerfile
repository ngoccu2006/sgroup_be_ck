FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3107

USER node

CMD [ "node", "src/server.js" ]
