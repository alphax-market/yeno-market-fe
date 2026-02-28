#!/usr/bin/env bash
# Fetch GitHub Actions secrets from AWS SSM and set GitHub secrets + variables (staging + production).
# Usage:
#   ./scripts/sync-github-secrets-from-ssm.sh              # print secret values only
#   ./scripts/sync-github-secrets-from-ssm.sh --sync        # set GitHub secrets only
#   ./scripts/sync-github-secrets-from-ssm.sh --sync-all   # auth + set secrets + set variables (full setup)
# Requires: AWS CLI configured. For --sync/--sync-all: gh (see .local/bin) and either run `gh auth login` once,
#   or set GITHUB_TOKEN in env, or store in SSM: /yeno/frontend-deploy/github-token (SecureString)
set -e
REGION="${AWS_REGION:-us-east-1}"
PREFIX="/yeno/frontend-deploy"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# Use local gh if present
export PATH="$REPO_ROOT/.local/bin:${PATH:-}"
# Target repo (e.g. alphax-market/yeno-market-fe); optional, defaults to current repo
GH_REPO="${GH_REPO:-alphax-market/yeno-market-fe}"
GH_REPO_ARG="--repo $GH_REPO"

get_param() {
  aws ssm get-parameter --name "$1" --with-decryption --region "$REGION" --query 'Parameter.Value' --output text
}

echo "Fetching from SSM $PREFIX ..."
AWS_ACCESS_KEY_ID=$(get_param "$PREFIX/aws-access-key-id")
AWS_SECRET_ACCESS_KEY=$(get_param "$PREFIX/aws-secret-access-key")
VITE_PRIVY_APP_ID=$(get_param "$PREFIX/vite-privy-app-id")

do_sync_all() {
  if ! command -v gh &>/dev/null; then
    echo "Error: gh CLI required. Install to .local/bin or run: brew install gh"
    exit 1
  fi
  # Optional: auth from SSM or env
  if ! gh auth status &>/dev/null; then
    if [ -n "${GITHUB_TOKEN:-}" ]; then
      echo "$GITHUB_TOKEN" | gh auth login --with-token
    elif aws ssm get-parameter --name "$PREFIX/github-token" --with-decryption --region "$REGION" --query 'Parameter.Value' --output text 2>/dev/null | grep -q .; then
      GITHUB_TOKEN=$(get_param "$PREFIX/github-token")
      echo "$GITHUB_TOKEN" | gh auth login --with-token
    else
      echo "Run once: gh auth login" && echo "Then re-run this script." && exit 1
    fi
  fi
  cd "$REPO_ROOT"
  echo "Target repo: $GH_REPO"
  echo "Setting GitHub secrets for staging and prod..."
  for env in staging prod; do
    echo "$AWS_ACCESS_KEY_ID"     | gh secret set AWS_ACCESS_KEY_ID --env "$env" $GH_REPO_ARG
    echo "$AWS_SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY --env "$env" $GH_REPO_ARG
    echo "$VITE_PRIVY_APP_ID"     | gh secret set VITE_PRIVY_APP_ID --env "$env" $GH_REPO_ARG
  done
  echo "Setting GitHub variables for staging..."
  gh variable set VITE_API_URL --env staging --body "https://api-staging.yeno.trade/api" $GH_REPO_ARG
  gh variable set VITE_WS_URL --env staging --body "wss://api-staging.yeno.trade" $GH_REPO_ARG
  gh variable set S3_BUCKET --env staging --body "yeno-trade-frontend-staging" $GH_REPO_ARG
  gh variable set CLOUDFRONT_DISTRIBUTION_ID --env staging --body "E1TYDX465WLVE9" $GH_REPO_ARG
  echo "Setting GitHub variables for prod..."
  gh variable set VITE_API_URL --env prod --body "https://api.yeno.trade/api" $GH_REPO_ARG
  gh variable set VITE_WS_URL --env prod --body "wss://api.yeno.trade" $GH_REPO_ARG
  gh variable set S3_BUCKET --env prod --body "yeno-trade-frontend" $GH_REPO_ARG
  gh variable set CLOUDFRONT_DISTRIBUTION_ID --env prod --body "E23WYPIM41NMB3" $GH_REPO_ARG
  echo "Done. Secrets and variables set for $GH_REPO (staging + prod)."
}

if [ "${1:-}" = "--sync-all" ]; then
  do_sync_all
elif [ "${1:-}" = "--sync" ]; then
  if ! command -v gh &>/dev/null; then
    echo "Error: gh CLI required. Install to .local/bin or run: brew install gh"
    exit 1
  fi
  if ! gh auth status &>/dev/null; then
    if [ -n "${GITHUB_TOKEN:-}" ]; then echo "$GITHUB_TOKEN" | gh auth login --with-token
    elif aws ssm get-parameter --name "$PREFIX/github-token" --with-decryption --region "$REGION" --query 'Parameter.Value' --output text 2>/dev/null | grep -q .; then
      get_param "$PREFIX/github-token" | gh auth login --with-token
    else
      echo "Run once: gh auth login" && echo "Then re-run this script." && exit 1
    fi
  fi
  cd "$REPO_ROOT"
  echo "Target repo: $GH_REPO"
  echo "Setting GitHub Actions secrets for staging and prod..."
  for env in staging prod; do
    echo "$AWS_ACCESS_KEY_ID"     | gh secret set AWS_ACCESS_KEY_ID --env "$env" $GH_REPO_ARG
    echo "$AWS_SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY --env "$env" $GH_REPO_ARG
    echo "$VITE_PRIVY_APP_ID"     | gh secret set VITE_PRIVY_APP_ID --env "$env" $GH_REPO_ARG
  done
  echo "Done. Secrets set for $GH_REPO (staging + prod)."
else
  echo ""
  echo "Add these to GitHub → Settings → Secrets and variables → Actions (per env or repo):"
  echo ""
  echo "  AWS_ACCESS_KEY_ID     = $AWS_ACCESS_KEY_ID"
  echo "  AWS_SECRET_ACCESS_KEY = (from SSM; run with --sync to push to GitHub)"
  echo "  VITE_PRIVY_APP_ID     = $VITE_PRIVY_APP_ID"
  echo ""
  echo "Full setup (secrets + variables): ./scripts/sync-github-secrets-from-ssm.sh --sync-all"
fi
