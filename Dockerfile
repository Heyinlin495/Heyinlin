# ---- Stage 1: Frontend build ----
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --ignore-scripts

COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Backend build ----
FROM node:22-alpine AS backend-build
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN apk add --no-cache python3 make g++ && \
    npm ci --ignore-scripts && \
    apk del python3 make g++

COPY backend/tsconfig.json backend/src/ ./src/
RUN npx tsc

# ---- Stage 3: Runtime ----
FROM node:22-alpine

RUN apk add --no-cache dumb-init

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install production dependencies only
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    rm -rf /tmp/*

# Copy compiled backend
COPY --from=backend-build /app/dist ./dist

# Copy built frontend static files
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create data and uploads directories with correct ownership
RUN mkdir -p data uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["dumb-init", "--", "node", "dist/index.js"]
