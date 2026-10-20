# SPDX-License-Identifier: AGPL-3.0-or-later
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/app/package.json frontend/app/package.json
COPY frontend/admin/package.json frontend/admin/package.json
COPY frontend/web/package.json frontend/web/package.json
RUN npm ci
COPY backend backend
COPY frontend frontend
RUN npm run build
RUN cp -r backend/src/database/migrations backend/dist/database/migrations

FROM node:24-bookworm-slim AS api
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/app/package.json frontend/app/package.json
COPY frontend/admin/package.json frontend/admin/package.json
COPY frontend/web/package.json frontend/web/package.json
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/backend/dist backend/dist
USER node
ENV HOST=0.0.0.0 PORT=3001 DEMO_MODE=false
EXPOSE 3001
CMD ["node", "backend/dist/main.js"]

FROM nginx:1.29-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/web/dist /usr/share/nginx/html
COPY --from=build /app/frontend/app/dist /usr/share/nginx/html/app
COPY --from=build /app/frontend/admin/dist /usr/share/nginx/html/admin
EXPOSE 80
