#!/bin/bash

# Set error handling
set -e
set -o pipefail

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check HTTP endpoint with retries
check_endpoint() {
    local url=$1
    local retries=${2:-3}
    local wait_time=${3:-5}
    local attempt=1

    while [ $attempt -le $retries ]; do
        log "Attempt $attempt/$retries: Checking $url"
        if wget -q --spider --timeout=10 --no-check-certificate "$url"; then
            log "✅ $url is accessible"
            return 0
        else
            log "❌ $url is not accessible"
            if [ $attempt -lt $retries ]; then
                log "Waiting ${wait_time}s before next attempt..."
                sleep $wait_time
            fi
        fi
        attempt=$((attempt + 1))
    done
    return 1
}

# Main debug process
main() {
    log "=== Starting CI/CD Debug Process ==="

    # Check Docker and docker-compose versions
    log "=== System Information ==="
    docker --version
    docker-compose --version

    # Check if images exist
    log "=== Checking Docker Images ==="
    docker images | grep monkids

    # Check container status
    log "=== Container Status ==="
    docker-compose ps --format json

    # Check container health status
    log "=== Container Health Status ==="
    docker inspect --format='{{.Name}} - {{.State.Health.Status}}' $(docker-compose ps -q)

    # Check backend health
    log "=== Backend Health Check ==="
    check_endpoint "http://localhost:8000/api/health" 5 10

    # Check nginx health
    log "=== Nginx Health Check ==="
    check_endpoint "https://api.monkids.site/api/health" 5 10

    # Get container logs
    log "=== Backend Container Logs ==="
    docker-compose logs --tail=50 backend

    log "=== Nginx Container Logs ==="
    docker-compose logs --tail=50 nginx

    # Check network connectivity
    log "=== Network Status ==="
    docker network ls | grep backend-network
    
    # Print environment variables (excluding sensitive data)
    log "=== Environment Variables ==="
    docker-compose config | grep -v "SECRET\|PASSWORD\|KEY"
}

# Run main function and capture exit code
main 2>&1 | tee ci-debug.log
exit ${PIPESTATUS[0]} 