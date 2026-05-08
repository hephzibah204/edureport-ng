FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG PRISMA_SCHEMA=prisma/schema.sqlite.prisma
ENV PRISMA_SCHEMA=$PRISMA_SCHEMA
RUN npx prisma generate --schema $PRISMA_SCHEMA
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ARG PRISMA_SCHEMA=prisma/schema.sqlite.prisma
ENV PRISMA_SCHEMA=$PRISMA_SCHEMA
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["sh","-c","npx prisma db push --schema $PRISMA_SCHEMA && node dist/server.js"]
