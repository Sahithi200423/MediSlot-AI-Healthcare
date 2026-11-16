# Build & Run stage for MediSlot Node.js Express Server
FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests and Prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy all application source code
COPY . .

# Explicitly generate Prisma client and build TypeScript
RUN npm run build

ENV PORT=10000
EXPOSE 10000

CMD ["node", "dist/index.js"]
