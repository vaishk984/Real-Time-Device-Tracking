# Use official Node image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy rest of the project
COPY . .

# Expose port and start app
EXPOSE 3000
CMD ["node", "app.js"]
