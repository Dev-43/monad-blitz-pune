FROM node:20-slim

WORKDIR /app

# Pre-install typescript, jest, and ts-jest to make execution fast
RUN npm init -y && \
    npm install typescript jest ts-jest @types/jest --save-dev

# Initialize ts-jest config
RUN npx ts-jest config:init

# Copy runner script
COPY runner-entrypoint.sh /app/runner-entrypoint.sh
RUN chmod +x /app/runner-entrypoint.sh

ENTRYPOINT ["/app/runner-entrypoint.sh"]
