# Multi-stage Bun Dockerfile for Ketarisentry
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy application source files
COPY . .

# Initialize SQLite schema & build production frontend assets
RUN bun run db:init
RUN bun run build

# Expose API & dev ports
EXPOSE 3001
EXPOSE 5173

# Environmental defaults
ENV PORT=3001
ENV NODE_ENV=production
ENV DB_PATH="database/ketarisentry.db"

# Create persistent storage directories
RUN mkdir -p database logs

# Start Bun API Server
CMD ["bun", "run", "server/index.ts"]
