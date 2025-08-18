FROM node:20-slim

WORKDIR /app

# Build argument for environment
ARG NODE_ENV=development

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY frontend/ .

# Build for production if needed
RUN if [ "$NODE_ENV" = "production" ] ; then \
    npm run build && \
    npm install -g serve ; \
    fi

# Expose port
EXPOSE 3000

# Set environment variables
ENV CI=true
ENV WDS_SOCKET_PORT=0

# Start the appropriate server
CMD if [ "$NODE_ENV" = "production" ] ; then \
    serve -s build -l 3000 ; \
    else \
    npm start ; \
    fi
