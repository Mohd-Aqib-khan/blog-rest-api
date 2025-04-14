# Use Node.js 18 as the base image
FROM node:18 AS build
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy the rest of the source code
COPY . .
# Build the Nest.js app
RUN npm run build

# Production stage
FROM node:18-slim
WORKDIR /app
# Copy only the necessary files from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# Expose the correct port (5000 based on your nest-service)
EXPOSE 5000
# Run the compiled app
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
CMD ["./entrypoint.sh"]