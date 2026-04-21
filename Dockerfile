FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
EXPOSE 3200

CMD ["npm", "run", "start"]