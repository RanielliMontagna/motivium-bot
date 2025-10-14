# ===============================
# Stage 1: Build
# ===============================
FROM node:24-alpine3.21 AS builder

WORKDIR /usr/src/app

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

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
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/settings.json ./settings.json

CMD ["pnpm", "start:migrate:prod"]