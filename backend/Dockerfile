FROM node:16-bullseye AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update \
    && apt-get install -y build-essential python3 \
    && npm install -g npm@8.19.4 \
    && npm install -g @nestjs/cli@9.5.0 \
    && npm cache clean --force

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps --no-optional \
    && npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build \
    && npm prune --production --legacy-peer-deps

# Production stage
FROM node:16-bullseye-slim

WORKDIR /app

# Install Chrome dependencies
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y \
        google-chrome-stable \
        fonts-ipafont-gothic \
        fonts-wqy-zenhei \
        fonts-thai-tlwg \
        fonts-kacst \
        fonts-freefont-ttf \
        libxss1 \
        dbus \
        dbus-x11 \
        xvfb \
        libxtst6 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r pptruser \
    && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser \
    && mkdir -p /home/pptruser/.local/share/applications \
    && mkdir -p /home/pptruser/.cache/fontconfig \
    && mkdir -p /home/pptruser/.cache/puppeteer \
    && mkdir -p /home/pptruser/.config \
    && touch /home/pptruser/.local/share/applications/mimeapps.list \
    && chown -R pptruser:pptruser /home/pptruser \
    && chmod -R 755 /home/pptruser \
    && mkdir -p /var/run/dbus \
    && chown -R pptruser:pptruser /var/run/dbus \
    && chmod -R 755 /var/run/dbus

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Configure environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome \
    PUPPETEER_NO_SANDBOX=true \
    DISPLAY=:99 \
    HOME=/home/pptruser \
    NODE_ENV=production \
    PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer \
    NODE_OPTIONS="--max-old-space-size=512"

# Set final permissions
RUN mkdir -p /var/run/dbus \
    && chown -R pptruser:pptruser /app /var/run/dbus \
    && chmod -R 755 /var/run/dbus

# Switch to pptruser
USER pptruser

# Expose port
EXPOSE 8000

# Start application with system services and Xvfb
CMD ["sh", "-c", "dbus-daemon --system --nofork & Xvfb :99 -screen 0 1024x768x16 & google-chrome --version && npm run start:prod"]
