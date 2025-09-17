FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install only production dependencies
RUN npm install 

# Copy the rest of the project files
COPY . .

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "index.js"]
