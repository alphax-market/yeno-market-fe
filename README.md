Hello welcome to YeNo

## Deploy flow

| Branch   | Who can update        | What runs on push/merge |
|----------|----------------------|---------------------------|
| **staging** | Anyone (direct push or merge, no PR required) | **Staging — Build & Deploy** → build then deploy to S3 staging + CloudFront staging |
| **main**    | Only via **PR from staging** (1 approval required) | **Production — Build & Deploy** → build then deploy to S3 prod + CloudFront prod |

- **Staging:** Push or merge to `staging` anytime → staging deploys. No review needed.
- **Production:** Open a PR **staging → main**. After review and merge, the prod workflow runs automatically (no extra step).