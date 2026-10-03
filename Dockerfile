# ==========================================
# Adaptive Carbon-Aware Workload Orchestrator
# Multi-Stage Production Dockerfile
# ==========================================

# ------------------------------------------
# Stage 1: Build the Frontend Assets
# ------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies needed for Vite build)
RUN npm ci

# Copy source code and config
COPY tsconfig.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/ 2>/dev/null || true

# Build production bundle
RUN npm run build

# ------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Install Python 3, pip, and curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements & install
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt 2>/dev/null || \
    pip3 install --no-cache-dir -r requirements.txt

# Copy package manifests & install production dependencies
COPY package*.json ./
RUN npm ci

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server, python engine, docs & configs
COPY server.ts ./
COPY app/ ./app/
COPY docs/ ./docs/
COPY index.html ./
COPY vite.config.ts tsconfig.json ./

# Default environment configuration
ENV NODE_ENV=production
ENV PORT=3001

# Expose web service port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the full-stack server
CMD ["npm", "start"]
