FROM node:18-alpine

WORKDIR /app

# Install dependencies required for building
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 8000

# Start the application
CMD ["npm", "run", "start:prod"] 