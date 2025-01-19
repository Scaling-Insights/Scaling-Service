# Base image
FROM node:18-bullseye AS base

# Set the working directory inside the container
WORKDIR /app

# Install PNPM globally
RUN npm install -g pnpm

# Copy only the package manager-related files for better caching
COPY pnpm-lock.yaml ./
COPY package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the entire application code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:18-bullseye AS production

# Set the working directory inside the container
WORKDIR /app

# Install PNPM globally
RUN npm install -g pnpm

# Copy necessary files from the build stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-lock.yaml ./
COPY --from=base /app/node_modules ./node_modules

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
