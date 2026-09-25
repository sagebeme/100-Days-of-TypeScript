# A container image for the API. Build it from the root of the repo:
#   docker build -f phase-5-backend/day-065-deploy-a-node-api/starter/Dockerfile -t ticketing-api .
#   docker run -p 3000:3000 -e NODE_ENV=production -e SESSION_SECRET=... -e DATABASE_PATH=/data/app.db \
#     -e CORS_ORIGIN=https://your-site.example -v ticketing-data:/data ticketing-api

# Node 24 runs TypeScript directly, so there's no build step: the image is Node plus your code.
FROM node:24-slim

WORKDIR /app

# Dependencies first, on their own layer: they change rarely, so rebuilds after a code change are fast.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY phase-5-backend/day-065-deploy-a-node-api/starter/ ./app/

# Don't run as root inside the container: if the app is ever broken into, the damage stays small.
RUN mkdir -p /data && chown node:node /data
USER node

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# The platform's health checks call /health/live and /health/ready.
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://localhost:3000/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "app/main.ts"]
