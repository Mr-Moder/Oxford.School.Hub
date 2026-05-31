#!/bin/bash
set -e

export BASE_PATH=/
export PORT=3000
export NODE_ENV=production

pnpm --filter @workspace/school-dashboard run build

mkdir -p dist
cp -r artifacts/school-dashboard/dist/public/. dist/
