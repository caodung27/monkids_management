FROM node:18-slim

WORKDIR /app

# Install Chrome dependencies
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    xvfb xauth libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
    libxi6 libxrandr2 libxrender1 libxss1 libxtst6 libnss3 libcups2 libxss1 libxrandr2 \
    libasound2 libpangocairo-1.0-0 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Add user for running Chrome
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Add puppeteer configuration
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
ENV DISPLAY=:99

# Switch to pptruser
USER pptruser

# Expose port
EXPOSE 8000

# Start application with Xvfb
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x16 & npm run start:prod"]
