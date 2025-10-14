# ===============================
# Stage 1: Build
# ===============================
FROM node:24-alpine3.21 AS builder

WORKDIR /usr/src/app

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install with network timeout and retry settings
RUN pnpm config set network-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 10000 && \
    pnpm config set fetch-retry-maxtimeout 60000 && \
    pnpm install --frozen-lockfile --prod=false

COPY . .

RUN pnpm run build


# ===============================
# Stage 2: Production
# ===============================
FROM node:24-alpine3.21 AS runner

WORKDIR /usr/src/app

# Dependências para rodar o Chrome Headless
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Puppeteer espera esse path por padrão no Alpine
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

# Install only production dependencies with optimized settings
RUN pnpm config set network-timeout 300000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 10000 && \
    pnpm config set fetch-retry-maxtimeout 60000 && \
    pnpm install --frozen-lockfile --prod=true --ignore-scripts

# Copy prisma files after install to avoid issues with postinstall scripts
COPY prisma/ ./prisma/

# Generate Prisma Client manually after copying prisma files
RUN npx prisma generate --schema=./prisma/schema/schema.prisma

COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/settings.json ./settings.json

CMD ["pnpm", "start:migrate:prod"]