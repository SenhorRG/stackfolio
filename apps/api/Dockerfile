FROM node:20-bookworm AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm install --filter @stackfolio/api...
RUN pnpm --filter @stackfolio/shared build
RUN pnpm --filter @stackfolio/api exec prisma generate
RUN pnpm --filter @stackfolio/api build

FROM mcr.microsoft.com/playwright:v1.49.1-jammy AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ../packages/shared/dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
