# Monopoly Online — Node.js + Redis client (Redis runs in separate service)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
