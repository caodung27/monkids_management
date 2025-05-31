FROM amazonlinux:2

WORKDIR /app

# Install Node.js 16
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash - \
    && yum install -y nodejs

# Install Chrome dependencies and system utilities
RUN yum install -y wget tar xz \
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

# Setup dbus and system directories
RUN mkdir -p /var/run/dbus /var/run/upower \
    && dbus-uuidgen > /var/lib/dbus/machine-id \
    && mkdir -p /etc/upower

# Add user for running Chrome
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && mkdir -p /home/pptruser/.local/share/applications \
    && mkdir -p /home/pptruser/.cache/fontconfig \
    && mkdir -p /home/pptruser/.config \
    && chown -R pptruser:pptruser /home/pptruser \
    && chmod -R 755 /home/pptruser

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
ENV PUPPETEER_NO_SANDBOX=true
ENV DISPLAY=:99
ENV HOME=/home/pptruser

# Create cache directory and set permissions
RUN mkdir -p /home/pptruser/.cache/puppeteer \
    && chown -R pptruser:pptruser /home/pptruser/.cache \
    && chown -R pptruser:pptruser /app \
    && chown -R pptruser:pptruser /var/run/dbus \
    && chown -R pptruser:pptruser /var/run/upower \
    && chown -R pptruser:pptruser /etc/upower \
    && chmod -R 755 /var/run/dbus \
    && chmod -R 755 /var/run/upower \
    && chmod -R 755 /etc/upower

# Switch to pptruser
USER pptruser

# Update Puppeteer cache path for pptruser
ENV PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer

# Expose port
EXPOSE 8000

# Start application with system services and Xvfb
CMD ["sh", "-c", "dbus-daemon --system --nofork & upowerd & Xvfb :99 -screen 0 1024x768x16 & google-chrome --version && npm run start:prod"]
