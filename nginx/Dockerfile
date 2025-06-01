FROM nginx:alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx config
COPY default.conf /etc/nginx/conf.d/

# Test nginx configuration
RUN nginx -t 