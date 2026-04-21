FROM node:22-bookworm-slim
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

EXPOSE 3200

CMD ["npm", "run", "dev"]