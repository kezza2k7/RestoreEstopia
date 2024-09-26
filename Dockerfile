# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install the dependencies
RUN npm install --production

# Copy the rest of the application files
COPY . .

# Command to start the bot using node
CMD ["node", "index.js"]
