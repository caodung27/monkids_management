FROM amazonlinux:2 as builder

WORKDIR /app

# Install Node.js 18 and build dependencies
RUN curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - \
    && yum install -y nodejs git python3 make gcc-c++ \
    && yum clean all \
    && rm -rf /var/cache/yum

# Update npm and install NestJS CLI
RUN npm install -g npm@10.2.4 \
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
FROM amazonlinux:2

WORKDIR /app

# Install Node.js 18 and Chrome dependencies in a single layer
RUN curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - \
    && yum install -y nodejs wget \
    && amazon-linux-extras install epel -y \
    && yum install -y \
        dbus dbus-x11 \
        upower \
        xorg-x11-server-Xvfb \
        xorg-x11-xauth \
        libX11 \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXrandr \
        libXrender \
        libXtst \
        libXScrnSaver \
        pango \
        at-spi2-atk \
        gtk3 \
        alsa-lib \
        nss \
        cups-libs \
        GConf2 \
    && wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm \
    && yum install -y ./google-chrome-stable_current_x86_64.rpm \
    && rm google-chrome-stable_current_x86_64.rpm \
    && yum clean all \
    && rm -rf /var/cache/yum

# Setup system directories and user in a single layer
RUN mkdir -p /var/run/dbus /var/run/upower \
    && dbus-uuidgen > /var/lib/dbus/machine-id \
    && mkdir -p /etc/upower \
    && groupadd -r pptruser \
    && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/{Downloads,.local/share/applications,.cache/{fontconfig,puppeteer},.config} \
    && chown -R pptruser:pptruser /home/pptruser \
    && chmod -R 755 /home/pptruser

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
RUN chown -R pptruser:pptruser /app /var/run/{dbus,upower} /etc/upower \
    && chmod -R 755 /var/run/{dbus,upower} /etc/upower

# Switch to pptruser
USER pptruser

# Expose port
EXPOSE 8000

# Start application with system services and Xvfb
CMD ["sh", "-c", "dbus-daemon --system --nofork & upowerd & Xvfb :99 -screen 0 1024x768x16 & google-chrome --version && npm run start:prod"]
