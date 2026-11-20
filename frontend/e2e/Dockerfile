FROM node:22
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client && rm -rf /var/lib/apt/lists/*
RUN npx playwright install --with-deps chromium
COPY frontend/ ./
CMD ["npm", "run", "test:live"]
