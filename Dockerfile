# CareCompass — production image for AWS App Runner / ECR
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm install --prefix backend --omit=dev \
  && npm install --prefix frontend

COPY backend ./backend
COPY frontend ./frontend
COPY package.json ./

RUN npm run build --prefix frontend \
  && npm prune --prefix frontend --omit=dev

ENV NODE_ENV=production
ENV PORT=8080
ENV CLIENT_ORIGIN=*
ENV DATA_DIR=/tmp/carecompass-data
ENV JWT_SECRET=CareCompass_AppRunner_Prod_9f3a7c2e8b1d4e6f0a5c9b7d3e1f8a2c

EXPOSE 8080

CMD ["npm", "start", "--prefix", "backend"]
