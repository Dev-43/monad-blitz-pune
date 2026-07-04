FROM node:20-slim

WORKDIR /app

# Pre-install typescript, jest, and ts-jest to make execution fast
RUN npm init -y && npm install --no-audit --no-fund \
  typescript@5.6.3 jest@29.7.0 ts-jest@29.2.5 @types/jest@29.5.13 \
  --save-dev
# Initialize ts-jest config
RUN npx ts-jest config:init

# Copy runner script
COPY runner-entrypoint.sh /app/runner-entrypoint.sh
RUN chmod +x /app/runner-entrypoint.sh

ENTRYPOINT ["/app/runner-entrypoint.sh"]
