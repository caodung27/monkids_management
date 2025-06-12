FROM node:16-bullseye AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update \
    && apt-get install -y build-essential python3 \
    && npm install -g npm@8.19.4 \
    && npm install -g @nestjs/cli@9.5.0 \
    && npm cache clean --force \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps --no-optional \
    && npm cache clean --force \
    && rm -rf /root/.npm

# Copy source and build
COPY . .
RUN npm run build \
    && npm prune --production --legacy-peer-deps \
    && rm -rf /root/.npm \
    && rm -rf /root/.cache

# Production stage
FROM ubuntu:20.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js
RUN apt-get update \
    && apt-get install -y curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@8.19.4 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Add Chrome repository and install Chrome
RUN apt-get update \
    && apt-get install -y wget \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y \
        google-chrome-stable \
        fonts-ipafont-gothic \
        fonts-wqy-zenhei \
        fonts-thai-tlwg \
        fonts-kacst \
        fonts-freefont-ttf \
        libxss1 \
        xvfb \
        libxtst6 \
        fontconfig \
        libgbm1 \
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libglu1-mesa \
        libasound2 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && rm -rf /var/cache/apt/* \
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
    && chmod -R 755 /var/cache/fontconfig

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
    CHROME_PATH=/usr/bin/google-chrome \
    CHROMIUM_PATH=/usr/bin/google-chrome \
    PUPPETEER_NO_SANDBOX=true \
    DISPLAY=:99 \
    HOME=/tmp \
    NODE_ENV=production \
    PUPPETEER_CACHE_DIR=/tmp/.cache/puppeteer \
    NODE_OPTIONS="--max-old-space-size=512"

# Set final permissions and cleanup
RUN chown -R root:root /app \
    && chmod -R 755 /app \
    && rm -rf /root/.npm \
    && rm -rf /root/.cache \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Expose port
EXPOSE 8000

# Create startup script with cleanup
RUN echo '#!/bin/bash\n\
Xvfb :99 -screen 0 1024x768x16 &\n\
XVFB_PID=$!\n\
sleep 2\n\
google-chrome --version\n\
npm run start:prod\n\
kill $XVFB_PID\n\
rm -rf /tmp/*\n\
rm -rf /var/tmp/*' > /app/start.sh \
    && chmod +x /app/start.sh

# Start application with Xvfb
CMD ["/app/start.sh"]
