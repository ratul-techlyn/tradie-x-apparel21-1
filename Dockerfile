FROM node:18-alpine

# Expose port 3000
EXPOSE 3000

# Set the working directory
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Copy dependency files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Optional: Remove CLI packages to reduce image size
RUN npm remove @shopify/cli

# Install OpenSSL (ensure it's up to date)
RUN apk update && apk add --no-cache openssl

# Copy the application code
COPY . .

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "run", "docker-start"]
