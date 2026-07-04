#!/bin/sh
set -e

# 1. Verify User is 1000:1000
if [ "$(id -u)" != "1000" ] || [ "$(id -g)" != "1000" ]; then
  echo "Security Error: Container must run as user 1000:1000 (running as $(id -u):$(id -g))" >&2
  exit 1
fi

# 2. Verify Read-Only Root Filesystem (try writing to /app)
if touch /app/test_write 2>/dev/null; then
  echo "Security Error: Root filesystem is not read-only" >&2
  rm -f /app/test_write
  exit 1
fi

# 3. Verify Network is disabled
# We check network instantly by listing OS network interfaces using Node.js
# If there are any interfaces other than loopback ('lo'), then network is enabled.
if node -e "const interfaces = Object.keys(require('os').networkInterfaces()); const hasNonLoopback = interfaces.some(name => name !== 'lo'); process.exit(hasNonLoopback ? 0 : 1);" 2>/dev/null; then
  echo "Security Error: Network is accessible" >&2
  exit 1
fi

# 4. Verify memory limit (256m = 268435456 bytes)
MEM_LIMIT=""
if [ -f /sys/fs/cgroup/memory.max ]; then
  MEM_LIMIT=$(cat /sys/fs/cgroup/memory.max)
elif [ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
  MEM_LIMIT=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)
fi
if [ "$MEM_LIMIT" != "" ] && [ "$MEM_LIMIT" != "max" ]; then
  if [ "$MEM_LIMIT" -gt 268435456 ]; then
    echo "Security Error: Memory limit is greater than 256MB" >&2
    exit 1
  fi
fi

# 5. Verify PIDs limit (64)
PIDS_LIMIT=""
if [ -f /sys/fs/cgroup/pids.max ]; then
  PIDS_LIMIT=$(cat /sys/fs/cgroup/pids.max)
elif [ -f /sys/fs/cgroup/pids/pids.max ]; then
  PIDS_LIMIT=$(cat /sys/fs/cgroup/pids/pids.max)
fi
if [ "$PIDS_LIMIT" != "" ] && [ "$PIDS_LIMIT" != "max" ]; then
  if [ "$PIDS_LIMIT" -gt 64 ]; then
    echo "Security Error: PIDs limit is greater than 64" >&2
    exit 1
  fi
fi

# 6. Verify CPU limit (0.5 CPUs)
CPU_QUOTA=""
CPU_PERIOD=""
if [ -f /sys/fs/cgroup/cpu.max ]; then
  CPU_QUOTA=$(cat /sys/fs/cgroup/cpu.max | awk '{print $1}')
  CPU_PERIOD=$(cat /sys/fs/cgroup/cpu.max | awk '{print $2}')
elif [ -f /sys/fs/cgroup/cpu/cpu.cfs_quota_us ] && [ -f /sys/fs/cgroup/cpu/cpu.cfs_period_us ]; then
  CPU_QUOTA=$(cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us)
  CPU_PERIOD=$(cat /sys/fs/cgroup/cpu/cpu.cfs_period_us)
fi
if [ "$CPU_QUOTA" != "" ] && [ "$CPU_QUOTA" != "max" ] && [ "$CPU_QUOTA" -gt 0 ] && [ "$CPU_PERIOD" -gt 0 ]; then
  EXPECTED_QUOTA=$((CPU_PERIOD / 2))
  if [ "$CPU_QUOTA" -gt "$EXPECTED_QUOTA" ]; then
    echo "Security Error: CPU limit is greater than 0.5" >&2
    exit 1
  fi
fi

# Run Jest directly using node against the tests in the workspace directory.
# This avoids npx network check overhead and potential hangs.
cd /app/workspace
node /app/node_modules/jest/bin/jest.js --config /app/jest.config.js --json --passWithNoTests --no-cache 2>/dev/null || true
