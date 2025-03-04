# ===============================
# Stage 1: Build
# ===============================
FROM node:23.9-alpine AS builder

WORKDIR /usr/src/app

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

RUN pnpm run build

# ===============================
# Stage 2: Production
# ===============================
FROM node:23.9-alpine AS runner

WORKDIR /usr/src/app

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/settings.json ./settings.json

CMD ["node", "build/index.js"]