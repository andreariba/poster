FROM node:18-bullseye-slim

# Set working directory
WORKDIR /app

# Install build dependencies needed by better-sqlite3
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy package manifest and install production dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy backend sources
COPY backend/ ./backend/
# Place the server file at project root so the process cwd will contain blog.db
COPY backend/server.js ./server.js

EXPOSE 3000

CMD ["node", "server.js"]
