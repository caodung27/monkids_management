FROM amazonlinux:2

# Cài đặt Node.js và các dependencies trong một layer
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
    GConf2 \
    && yum clean all \
    && rm -rf /var/cache/yum

# Cài đặt Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm \
    && yum install -y ./google-chrome-stable_current_x86_64.rpm \
    && rm google-chrome-stable_current_x86_64.rpm

# Thiết lập user và thư mục
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/{Downloads,.local/share/applications,.cache/fontconfig,.config,.cache/puppeteer} \
    && mkdir -p /var/run/dbus /var/run/upower /etc/upower \
    && dbus-uuidgen > /var/lib/dbus/machine-id \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /var/run/dbus \
    && chown -R pptruser:pptruser /var/run/upower \
    && chown -R pptruser:pptruser /etc/upower \
    && chmod -R 755 /home/pptruser \
    && chmod -R 755 /var/run/dbus \
    && chmod -R 755 /var/run/upower \
    && chmod -R 755 /etc/upower

WORKDIR /app

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome \
    PUPPETEER_NO_SANDBOX=true \
    DISPLAY=:99 \
    HOME=/home/pptruser \
    PUPPETEER_CACHE_DIR=/home/pptruser/.cache/puppeteer

# Copy package files và cài đặt dependencies
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps \
    && npm cache clean --force

# Copy source code và build
COPY . .
RUN npm run build \
    && chown -R pptruser:pptruser /app

# Switch to pptruser
USER pptruser

# Expose port
EXPOSE 8000

# Start application
CMD ["sh", "-c", "dbus-daemon --system --nofork & upowerd & Xvfb :99 -screen 0 1024x768x16 & npm run start:prod"]
