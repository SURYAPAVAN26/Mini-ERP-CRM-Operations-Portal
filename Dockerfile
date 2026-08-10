# Multi-stage Dockerfile for cross-platform deployment (macOS, Linux, Windows)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build frontend and backend
RUN cd frontend && npm run build
RUN cd backend && npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --only=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
