FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm install --omit=dev; \
    else \
      npm install; \
    fi
COPY src ./src
EXPOSE 3000
CMD if [ "$NODE_ENV" = "production" ]; then \
      node src/index.js; \
    else \
      npx nodemon --watch src src/index.js; \
    fi
