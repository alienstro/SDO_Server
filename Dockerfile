# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy only package files first (layer caching)
COPY package*.json ./

# Install build dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --only=production

# Runtime stage - use distroless for minimal surface area
FROM node:22-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Change ownership of /app to nodejs user
RUN chown nodejs:nodejs /app

# Copy production dependencies from build
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Copy compiled code
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]