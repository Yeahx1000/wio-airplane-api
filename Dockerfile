# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.0.2

FROM public.ecr.aws/docker/library/node:${NODE_VERSION}-alpine AS base

WORKDIR /usr/src/app

FROM base AS deps

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM deps AS build

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build

FROM base AS final

ENV NODE_ENV=development

USER node

COPY package.json .
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/ ./

EXPOSE 3000

CMD ["npm", "start"]