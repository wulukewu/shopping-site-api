# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Rebuild bcrypt
RUN npm rebuild bcrypt

# Copy the application source code to the working directory
COPY . .

# Create the database directory
RUN mkdir -p ./database

# Expose the port the app will run on
EXPOSE 3000

# Command to run the application
CMD [ "npm", "start" ]