# Use the official Bun image
FROM oven/bun:debian

# Set the working directory
WORKDIR /app

# Copy all the application code
COPY . .

# Install dependencies
RUN bun install

# Build the application
RUN bun run build

# Delete useless files for production
RUN rm -rf src

# Set environment variables - PORT 8080 is necessary for Google App Engine
ENV PORT=8080 

# Your Mongo connection string in the form mongodb+srv://<user_name>:<password>@<cluster-name-in-lower-kebab-case>.pfr6n.mongodb.net/<db_name>?retryWrites=true&w=majority&appName=<Cluster-Name-asIt-is>
ENV MONGO_URI=

# Your smtp email address that will be used to send mail
ENV SMTP_MAIL=

# Your smtp mail password to authenticate
ENV SMTP_PASS=

# Command to run your app
CMD ["bun", "start"]