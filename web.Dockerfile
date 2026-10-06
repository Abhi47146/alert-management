# Build stage
FROM oven/bun:1.4.2 AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

# Run stage
FROM oven/bun:1.4.2-slim

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

EXPOSE 5000

ENTRYPOINT ["bun", "run", "dev"]
