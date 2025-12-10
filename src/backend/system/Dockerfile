# syntax=docker/dockerfile:1

# ______________________________________________________________________
#
# Base
# ______________________________________________________________________

FROM node:20-alpine AS base
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN npm install --frozen-lockfile || npm install --frozen-lockfile

# ______________________________________________________________________
#
# Development
# ______________________________________________________________________

FROM base AS development

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000
EXPOSE 9229

CMD ["npm", "run", "dev"]