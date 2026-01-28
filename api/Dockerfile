FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
EXPOSE 3000
CMD ["node", "server.js"]

