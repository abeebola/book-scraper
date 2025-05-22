# ----------- STAGE 1: Build stage -----------
FROM node:20-slim AS builder

# Install dependencies needed for build
RUN apt-get update && apt-get install -y \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package files to install deps first (cache-efficient)
COPY package*.json ./
RUN npm install

# Copy full app source
COPY . .

# Build the app (output to dist/)
RUN npm run build


# ----------- STAGE 2: Runtime stage -----------
FROM node:20-slim

# Install Chromium dependencies (Playwright)
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libu2f-udev \
  libvulkan1 \
  gnupg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the dist output and node_modules from build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Install Playwright + Chromium (only in final stage)
RUN npm install playwright && \
    npx playwright install --with-deps chromium

# Optionally expose default port (for docs)
EXPOSE 3000

# Default port environment variable (can be overridden)
ENV PORT=3000

# Start the app
CMD ["node", "dist/main"]
