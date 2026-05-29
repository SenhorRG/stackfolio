FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN pnpm install --filter @stackfolio/web...
RUN pnpm --filter @stackfolio/shared build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @stackfolio/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/public ./apps/web/public
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
