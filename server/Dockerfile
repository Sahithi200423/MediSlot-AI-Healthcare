# Build & Run stage for MediSlot Node.js Express Server
FROM node:22-alpine

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

# Copy dependency manifests and Prisma schema first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies safely without premature lifecycle scripts
RUN npm install --ignore-scripts

# Copy all application source code
COPY . .

# Explicitly generate Prisma Client and build TypeScript
RUN npx prisma generate
RUN npm run build

ENV PORT=10000
EXPOSE 10000

CMD ["node", "dist/index.js"]
