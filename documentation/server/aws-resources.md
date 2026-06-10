# AWS Resources

## Overview

SilverKey uses AWS services for authentication, storage, and infrastructure. All production resources are hosted in the **US-East-2 (Ohio)** region.

## Services

### Cognito

**Purpose:** User authentication and identity management

**User Pool:** `prod-silverkey-users`

**Configuration:**
- App clients: Web, mobile
- Password policy: Min 8 chars, requires uppercase, lowercase, number
- MFA: Optional (SMS or TOTP)
- Email verification: Required
- **Email delivery (SIL-46):** Send with **Amazon SES** (not Cognito default); FROM `noreply@usesilverkey.com` — see [ops/ses-cognito-onboarding.md](./ops/ses-cognito-onboarding.md)

**Environment Variables:**
```bash
AWS_COGNITO_USER_POOL_ID=us-east-2_XXXXX
AWS_COGNITO_CLIENT_ID=<client-id>
AWS_COGNITO_CLIENT_SECRET=<client-secret>
```

**Usage:**
```python
# Server validates Cognito tokens
from app.services.auth import cognito_service

user_info = cognito_service.validate_token(token)
```

### SES (Simple Email Service)

**Purpose:** Auth emails (via Cognito) and server-side transactional sends (newsletter, future notification pipeline)

**Region:** `us-east-2` (same as Cognito and app)

**Verified identity:** `usesilverkey.com` (domain + Easy DKIM)

**Default sender:** `noreply@usesilverkey.com` — `Server/app/services/email/ses_config.py`

**Setup runbook:** [ops/ses-cognito-onboarding.md](./ops/ses-cognito-onboarding.md) ([SIL-46](https://linear.app/silverkey/issue/SIL-46))

**Related Linear:** [SIL-187](https://linear.app/silverkey/issue/SIL-187) (server email pipeline), [SIL-188](https://linear.app/silverkey/issue/SIL-188) (configuration set + bounce handling)

### S3

**Purpose:** Document storage (DocuSign agreements, uploaded forms)

**Buckets:**
- `prod-silverkey-documents`: Production documents
- `dev-silverkey-documents`: Development/testing

**Configuration:**
- Versioning: Enabled
- Encryption: AES-256 (SSE-S3)
- Lifecycle: 90-day archive to Glacier
- Access: Private, presigned URLs for client

**Environment Variables:**
```bash
S3_BUCKET_NAME=prod-silverkey-documents
S3_REGION=us-east-2
```

**Usage:**
```python
from app.services.documents import s3_service

# Upload
url = s3_service.upload_file(file, bucket='documents', key='user/123/doc.pdf')

# Presigned URL for download
download_url = s3_service.generate_presigned_url(
    bucket='documents',
    key='user/123/doc.pdf',
    expiration=3600
)
```

### RDS (PostgreSQL)

**Purpose:** Primary database

**Instance:** `prod-silverkey-postgres`

**Configuration:**
- Engine: PostgreSQL 14.x
- Instance class: db.t3.medium (production)
- Storage: 100GB encrypted (gp3)
- Backups: Automated daily, 7-day retention
- Multi-AZ: Enabled for production

**Environment Variables:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/silverkey
```

### Secrets Manager

**Purpose:** API keys and sensitive configuration

**Naming note:** Some integrations use hierarchical names (examples below). **Production EC2 deploy** (`.github/workflows/ci_web.yml`) loads a fixed set of **short secret ids** in `us-east-2` via the instance IAM role. Those ids must exist (or you must override the database secret id—see below).

**EC2 prod deploy secret ids** (must match Secrets Manager names exactly; default database secret id is `db_url`):

| Secret id | Typical use |
|-----------|-------------|
| `db_url` (or override—see below) | `DATABASE_URL` for the app container |
| `AWS_Access` | AWS-related keys |
| `cognito` | Cognito |
| `gmaps` | Google Maps |
| `google_calendar` | Google Calendar |
| `census_api` | Census API |
| `mapbox` | Mapbox |
| `openai` | OpenAI |
| `perplexity` | Perplexity |
| `plaid` | Plaid |
| `serp` | SERP |
| `slipstream` | Slipstream |
| `skyslope` | SkySlope |
| `docusign` | DocuSign |

**Database secret (`db_url`) format:** Use **SecretString** (plaintext or JSON), not binary-only. Acceptable shapes: plaintext connection string; JSON object with one of `DATABASE_URL`, `database_url`, `db_url`, `url`, `connection_string`, `connectionString`, `uri`, `URI`; or a JSON-encoded string containing the URL.

**Override database secret id:** Set GitHub repository variable `DB_URL_SECRET_ID` to the Secrets Manager name (e.g. `prod/silverkey/database`). The deploy script defaults to `db_url` when unset. IAM on the EC2 instance must allow `GetSecretValue` on that secret’s ARN (with `*` suffix—see IAM section).

**Other documented examples** (may be used by apps or scripts outside this deploy list):

- `prod/silverkey/docusign/integration-key`
- `prod/silverkey/docusign/client-secret`
- `prod/silverkey/google/oauth-client-secret`
- `prod/silverkey/plaid/secret`

**Retrieval:**
```python
import boto3

client = boto3.client('secretsmanager', region_name='us-east-2')
response = client.get_secret_value(SecretId='prod/silverkey/docusign/client-secret')
secret = response['SecretString']
```

**Rotation:** Secrets rotated every 90 days (automated via Lambda)

**Verify from the EC2 instance** (after SSH): replace `db_url` with `DB_URL_SECRET_ID` if you overrode it.

```bash
aws secretsmanager get-secret-value --secret-id db_url --region us-east-2
```

- `AccessDeniedException` → instance role lacks `secretsmanager:GetSecretValue` on that secret’s ARN (include trailing `*` in IAM resource ARNs).
- `ResourceNotFoundException` → wrong secret name, region, or AWS account.
- Success with `SecretString` populated → if deploy still fails, check JSON keys or plaintext format above.

## IAM Roles and Policies

### App Role

**Role:** `prod-silverkey-app-role`

**Permissions:**
- S3: Read/write to `prod-silverkey-documents` bucket
- Secrets Manager: Read secrets the workload needs. If IAM only allows `prod/silverkey/*`, that **does not** grant access to top-level deploy secrets such as `db_url` or `AWS_Access`. Include **each** secret ARN (or a broader pattern) used by EC2 deploy, for example:

```json
{
  "Effect": "Allow",
  "Action": "secretsmanager:GetSecretValue",
  "Resource": [
    "arn:aws:secretsmanager:us-east-2:ACCOUNT_ID:secret:db_url*",
    "arn:aws:secretsmanager:us-east-2:ACCOUNT_ID:secret:AWS_Access*",
    "arn:aws:secretsmanager:us-east-2:ACCOUNT_ID:secret:cognito*",
    "arn:aws:secretsmanager:us-east-2:ACCOUNT_ID:secret:prod/silverkey/*"
  ]
}
```

Replace `ACCOUNT_ID` with the AWS account id. The random suffix on secret ARNs means the trailing `*` on individual secret name patterns is required unless you reference the full ARN from the console.

- RDS: Connect to database (via security group)
- Cognito: Validate tokens

**Trust Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### CI/CD User

**User:** `silverkey-ci-user`

**Permissions:**
- S3: Deploy frontend to CDN bucket
- ECR: Push Docker images
- ECS: Update task definitions

## Monitoring and Logging

### CloudWatch

**Log Groups:**
- `/aws/ecs/silverkey-app`: Application logs
- `/aws/rds/silverkey-postgres`: Database logs

**Alarms:**
- High CPU (>80% for 5 minutes)
- High memory (>90% for 5 minutes)
- Database connections (>90% of max)
- S3 4xx/5xx errors

### Cost Tracking

**Budget Alerts:**
- Development: $100/month
- Production: $500/month

**Cost Allocation Tags:**
```json
{
  "Environment": "production",
  "Application": "silverkey",
  "CostCenter": "engineering"
}
```

## Security

### Network

- VPC: Private subnets for RDS and app servers
- Security groups: Restrict inbound traffic
- HTTPS only: Enforce SSL/TLS

### Access Control

- IAM roles: Least privilege
- MFA required: For console access
- Secrets rotation: Automated every 90 days

### Compliance

- **GDPR:** Data residency in US-East-2 (opt-in EU regions)
- **Encryption:** At rest (S3, RDS) and in transit (TLS)
- **Backups:** Daily automated, 7-day retention

See: `documentation/compliance/`

## Deployment

### Infrastructure as Code

**Terraform:**
- State: `prod-silverkey-terraform-state` (S3 bucket)
- Lock: `prod-silverkey-terraform-locks` (DynamoDB table)

**Modules:**
- `network`: VPC, subnets, security groups
- `database`: RDS instance
- `storage`: S3 buckets
- `auth`: Cognito user pool
- `app`: ECS/EC2 instances

### CI/CD

**GitHub Actions:**
- Lint and test on PR
- Build Docker image on merge to main (or manual `workflow_dispatch` via `ci_web.yml`)
- Push to ECR with an **immutable tag** (`${GITHUB_SHA::12}`) and deploy by **digest** (`IMAGE_DIGEST`); `web-prod` is a moving convenience tag only
- SSH to EC2 and run [`.github/scripts/ec2-deploy.sh`](../../.github/scripts/ec2-deploy.sh) — starts **redis**, **cre_app** (Gunicorn via `gunicorn-entrypoint.sh`), **cre_worker**, **cre_beat**, optional **cre_worker_heavy** (`DEPLOY_HEAVY_WORKER=true`). Scale tuning env vars documented in [ops/scaling-playbook.md](./ops/scaling-playbook.md).

Optional repository variable **`DB_URL_SECRET_ID`**: overrides the default database secret name (`db_url`) for that workflow.

**Note:** Terraform modules and ECS-centric descriptions elsewhere in this doc are **aspirational or historical** — the active deploy path in git is **EC2 + Docker** as above.

## Disaster Recovery

### Backups

- **RDS:** Automated daily snapshots (7-day retention)
- **S3:** Versioning enabled (can restore deleted objects)
- **Secrets:** Manual backups to encrypted vault

### Recovery Time Objective (RTO)

- Database: 1 hour (restore from snapshot)
- Application: 15 minutes (redeploy from ECR)
- S3: Immediate (versioning)

### Recovery Point Objective (RPO)

- Database: 5 minutes (continuous backups)
- S3: 0 (versioning captures all changes)

## Cost Optimization

### Recommendations

1. **Right-size RDS:** Monitor CPU and scale down if underutilized
2. **S3 lifecycle:** Archive old documents to Glacier
3. **Reserved instances:** Purchase for production workloads
4. **Spot instances:** Use for dev/staging environments

### Current Costs (Estimated)

| Service | Monthly Cost |
|---------|--------------|
| RDS (production) | $150 |
| S3 | $50 |
| EC2/ECS | $200 |
| Cognito | $50 |
| Secrets Manager | $10 |
| **Total** | **$460** |

## Further Reading

- **AWS resource naming:** `.cursor/rules/shared/aws-resource-naming.mdc`
- **Security:** `.cursor/rules/shared/security.mdc`
- **Compliance:** `documentation/compliance/`
- **Server overview:** `Server/ARCHITECTURE.md`
- **Infrastructure reliability checklist (repo audit):** `documentation/server/infrastructure-reliability-gap-audit.md` — what is built vs. documentation-only vs. missing, relative to backups, Sentry/APM, uptime, staging parity, load tests, scaling, CDN, and rollback
