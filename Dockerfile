FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install only production dependencies
RUN npm install 

# Copy the rest of the project files
COPY . .

# Set environment variables for AWS
ENV AWS_ACCESS_KEY_ID=AKIAY352XOKBAVNZE77R
ENV AWS_SECRET_ACCESS_KEY=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
ENV AWS_REGION=ap-south-1

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "index.js"]
