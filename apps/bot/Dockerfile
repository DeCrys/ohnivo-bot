# Ohnivo bot - standalone discord.js worker.
# Runs TypeScript directly through tsx so the shared workspace package needs
# no separate build step.

FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/bot/package.json apps/bot/package.json

RUN npm ci

COPY packages/shared packages/shared
COPY apps/bot apps/bot

CMD ["npm", "run", "start", "-w", "@ohnivo/bot"]
