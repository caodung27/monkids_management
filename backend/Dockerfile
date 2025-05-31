FROM amazonlinux:2

# Install Node.js 16 and system dependencies first
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash - \
    && yum install -y nodejs wget tar xz \
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
    GConf2

# Install Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm \
    && yum install -y ./google-chrome-stable_current_x86_64.rpm \
    && rm google-chrome-stable_current_x86_64.rpm

# Setup system directories and permissions
RUN mkdir -p /var/run/dbus /var/run/upower /etc/upower \
    && dbus-uuidgen > /var/lib/dbus/machine-id \
    && groupadd -r pptruser \
    && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/{Downloads,.local/share/applications,.cache/fontconfig,.config,.cache/puppeteer} \
    && chown -R pptruser:pptruser /home/pptruser \
    && chmod -R 755 /home/pptruser \
    && chown -R pptruser:pptruser /var/run/dbus \
    && chown -R pptruser:pptruser /var/run/upower \
    && chown -R pptruser:pptruser /etc/upower \
    && chmod -R 755 /var/run/dbus \
    && chmod -R 755 /var/run/upower \
    && chmod -R 755 /etc/upower

# Set working directory and environment variables
WORKDIR /app
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome \
    PUPPETEER_NO_SANDBOX=true \
    DISPLAY=:99 \
    HOME=/home/pptruser \
    PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies with clean npm cache and remove unnecessary files
RUN npm cache clean --force \
    && npm install --legacy-peer-deps \
    && npm cache clean --force

# Copy source code and build
COPY . .
RUN npm run build \
    && chown -R pptruser:pptruser /app

# Switch to pptruser
USER pptruser

# Expose port
EXPOSE 8000

# Start application with system services and Xvfb
CMD ["sh", "-c", "dbus-daemon --system --nofork & upowerd & Xvfb :99 -screen 0 1024x768x16 & google-chrome --version && npm run start:prod"]
