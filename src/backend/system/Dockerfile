# syntax=docker/dockerfile:1

# ______________________________________________________________________
#
#  Base
# ______________________________________________________________________

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN npm install --frozen-lockfile


FROM base AS development


COPY . .

EXPOSE 3000 9229


CMD ["npm", "run", "dev"]