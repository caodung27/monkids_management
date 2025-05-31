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
        fontconfig \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/run/dbus \
    && mkdir -p /tmp/.local/share/applications \
    && touch /tmp/.local/share/applications/mimeapps.list \
    && mkdir -p /tmp/.cache/fontconfig \
    && mkdir -p /tmp/.cache/puppeteer \
    && mkdir -p /tmp/.config \
    && mkdir -p /usr/share/fonts/local \
    && mkdir -p /var/cache/fontconfig \
    && chown -R root:root /tmp/.local \
    && chown -R root:root /tmp/.cache \
    && chown -R root:root /tmp/.config \
    && chown -R root:root /usr/share/fonts/local \
    && chown -R root:root /var/cache/fontconfig \
    && chmod -R 777 /tmp/.local \
    && chmod -R 777 /tmp/.cache \
    && chmod -R 777 /tmp/.config \
    && chmod -R 755 /usr/share/fonts/local \
    && chmod -R 755 /var/cache/fontconfig \
    && chmod -R 777 /var/run/dbus \
    && dbus-uuidgen > /etc/machine-id \
    && mkdir -p /var/run/dbus \
    && chown -R root:root /var/run/dbus \
    && chmod -R 777 /var/run/dbus \
    && dbus-daemon --system --fork --nopidfile

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Configure environment variables
ENV FONTCONFIG_PATH=/etc/fonts \
    XDG_CACHE_HOME=/tmp/.cache \
    XDG_CONFIG_HOME=/tmp/.config \
    XDG_DATA_HOME=/tmp/.local/share \
    XDG_RUNTIME_DIR=/tmp \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome \
    PUPPETEER_NO_SANDBOX=true \
    DISPLAY=:99 \
    HOME=/tmp \
    NODE_ENV=production \
    PUPPETEER_CACHE_DIR=/tmp/.cache/puppeteer \
    NODE_OPTIONS="--max-old-space-size=512" \
    DBUS_SESSION_BUS_ADDRESS=unix:path=/var/run/dbus/system_bus_socket

# Set final permissions
RUN mkdir -p /var/run/dbus \
    && chown -R root:root /app \
    && chmod -R 755 /app

# Expose port
EXPOSE 8000

# Create startup script
RUN echo '#!/bin/bash\n\
dbus-daemon --system --nopidfile --nofork &\n\
DBUS_PID=$!\n\
Xvfb :99 -screen 0 1024x768x16 &\n\
XVFB_PID=$!\n\
google-chrome --version\n\
npm run start:prod\n\
kill $DBUS_PID\n\
kill $XVFB_PID' > /app/start.sh \
    && chmod +x /app/start.sh

# Start application with system services and Xvfb
CMD ["/app/start.sh"]
