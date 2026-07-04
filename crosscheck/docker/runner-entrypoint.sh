#!/bin/sh
set -e

# Create a writable workspace in /tmp
mkdir -p /tmp/run
if [ -d "/app/workspace" ]; then
  cp -r /app/workspace/* /tmp/run/
fi

# Link node_modules so dependencies (jest, ts-jest, typescript) are available
ln -s /app/node_modules /tmp/run/node_modules

# Copy the jest config generated during build
if [ -f "/app/jest.config.js" ]; then
  cp /app/jest.config.js /tmp/run/jest.config.js
fi

# Run Jest against the tests in the temp directory, outputting JSON to stdout
cd /tmp/run
npx jest --json --passWithNoTests --no-cache 2>/dev/null || true
