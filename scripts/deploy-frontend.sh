#!/usr/bin/env bash
# Build and deploy frontend to AWS S3 + CloudFront (staging or prod).
# Usage: ./scripts/deploy-frontend.sh [staging|prod]
# Reads AWS credentials and VITE_PRIVY_APP_ID from SSM (/yeno/frontend-deploy/*). Override with env vars if set.
set -e
REGION="${AWS_REGION:-us-east-1}"
PREFIX="/yeno/frontend-deploy"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV="${1:-}"
if [ "$ENV" != "staging" ] && [ "$ENV" != "prod" ]; then
  echo "Usage: $0 staging|prod"
  exit 1
fi

get_param() {
  aws ssm get-parameter --name "$1" --with-decryption --region "$REGION" --query 'Parameter.Value' --output text
}

# Load from SSM if not already in env
if [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then
  export AWS_ACCESS_KEY_ID=$(get_param "$PREFIX/aws-access-key-id")
fi
if [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  export AWS_SECRET_ACCESS_KEY=$(get_param "$PREFIX/aws-secret-access-key")
fi
if [ -z "${VITE_PRIVY_APP_ID:-}" ]; then
  export VITE_PRIVY_APP_ID=$(get_param "$PREFIX/vite-privy-app-id")
fi

if [ "$ENV" = "staging" ]; then
  export VITE_API_URL="${VITE_API_URL:-https://api-staging.yeno.trade/api}"
  export VITE_WS_URL="${VITE_WS_URL:-wss://api-staging.yeno.trade}"
  S3_BUCKET="yeno-trade-frontend-staging"
  CF_DIST_ID="E1TYDX465WLVE9"
else
  export VITE_API_URL="${VITE_API_URL:-https://api.yeno.trade/api}"
  export VITE_WS_URL="${VITE_WS_URL:-wss://api.yeno.trade}"
  S3_BUCKET="yeno-trade-frontend"
  CF_DIST_ID="E23WYPIM41NMB3"
fi

echo "== Deploy frontend to $ENV (S3: $S3_BUCKET, CF: $CF_DIST_ID) =="
cd "$REPO_ROOT"

echo "== Build =="
npm ci
npm run build

if [ ! -d "dist" ]; then
  echo "Build failed: no dist/"
  exit 1
fi

echo "== Upload to S3 =="
aws s3 sync dist/ "s3://$S3_BUCKET/" --delete --region "$REGION"

echo "== Invalidate CloudFront =="
aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*" --region "$REGION"

echo "== Deploy to $ENV done. =="
