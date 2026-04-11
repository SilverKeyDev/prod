# Strict Validation Mode Rollout

## Overview

Enable strict OpenAPI request validation to catch invalid API requests before they reach business logic.

**Current:** `OPENAPI_VALIDATION_MODE=gradual` (logs failures, allows bad requests)
**Target:** `OPENAPI_VALIDATION_MODE=strict` (returns 400 for invalid requests)

## Environment Variable

```bash
# .env or environment
OPENAPI_VALIDATION_MODE=strict
```

## Rollout Timeline

### Week 1: Staging Environment
- Enable strict mode in staging
- Monitor validation stats endpoint
- Fix any unexpected validation failures
- Verify error responses are helpful

### Week 2: Pre-Production (if applicable)
- Enable in pre-prod environment
- Continue monitoring
- Validate with realistic traffic

### Week 3-4: Production
- Enable in production
- Monitor 400 error rates
- Have rollback plan ready

## Monitoring

### Validation Stats Endpoint
```bash
# Check validation failure rates
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.silverkey.com/api/v1/admin/validation-stats
```

### Metrics to Track
- Request validation failure rate (target: <1%)
- Response validation log rate (informational only)
- 400 error rate increase (expect some increase, should stabilize)
- Customer-reported issues (should be zero if schemas are accurate)

### Log Queries
```
# Application logs - validation failures
level:error message:"Request validation failed"

# Application logs - response validation
level:warn message:"Response validation failed"
```

## Success Criteria

Before moving to next environment:
- ✅ Validation failure rate <1% for 1 week
- ✅ No customer-reported issues related to validation
- ✅ Validation catches actual bugs (not just false positives)
- ✅ Error messages are actionable

## Rollback Plan

If issues occur:

### Immediate Rollback
```bash
# Set environment variable
export OPENAPI_VALIDATION_MODE=gradual

# Restart service
# Docker: docker-compose restart api
# K8s: kubectl rollout restart deployment/api
```

### Investigation
1. Check validation stats endpoint
2. Review logs for validation failure patterns
3. Identify schemas causing false positives
4. Fix schemas or handler code
5. Re-enable strict mode

## Expected Impact

### Positive
- Catches malformed requests early (better error messages)
- Validates API contract is honored
- Improves API reliability
- Makes frontend errors more obvious

### Potential Issues
- Increased 400 errors (expected - these were always bugs)
- Schema mismatches cause valid requests to fail (fix schemas)
- Frontend needs to handle 400 responses gracefully

## Configuration by Environment

### Local Development
```bash
# .env.local
OPENAPI_VALIDATION_MODE=gradual  # or strict for testing
```

### Staging
```bash
# .env.staging
OPENAPI_VALIDATION_MODE=strict
```

### Production
```bash
# .env.production
OPENAPI_VALIDATION_MODE=strict  # After successful staging rollout
```

### Docker Compose
```yaml
# docker-compose.staging.yml
services:
  api:
    environment:
      - OPENAPI_VALIDATION_MODE=strict
```

### Kubernetes
```yaml
# values-staging.yaml
env:
  OPENAPI_VALIDATION_MODE: "strict"
```

## Testing Locally

### Enable Strict Mode
```bash
cd Server
export OPENAPI_VALIDATION_MODE=strict
flask run
```

### Test Invalid Request
```bash
# Should return 400 with validation errors
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "notanemail", "password": "x"}'

# Expected response:
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "field_errors": {
    "email": ["value is not a valid email address"],
    "password": ["ensure this value has at least 8 characters"]
  }
}
```

### Test Valid Request
```bash
# Should work normally
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "ValidPass123"}'
```

## Alerting Configuration

### High Validation Failure Rate
```
Alert: High request validation failures
Condition: validation_request_errors > 100/hour
Severity: Warning
Action: Notify backend team
```

### Sudden Spike in 400 Errors
```
Alert: 400 error rate spike
Condition: rate(http_400_errors[5m]) > 2x baseline
Severity: Critical
Action: Page on-call, check if validation enabled
```

## Communication Plan

### To Engineering Team
```
Subject: Strict API Validation Rollout - Staging

We're enabling strict OpenAPI validation in staging this week:

What it does:
- Invalid API requests now return 400 (were logged before)
- Better error messages for malformed requests
- Catches contract violations early

What to watch:
- Increased 400 errors (expected)
- Validation stats: https://staging-api/admin/validation-stats
- Report any unexpected validation failures

Docs: Server/docs/validation-strict-mode-rollout.md
```

### To Support Team
```
Subject: New API Validation - Better Error Messages

Starting this week, our API will return clearer error messages for invalid requests.

What changed:
- Invalid requests get immediate 400 errors
- Error messages explain exactly what's wrong
- Prevents bad data from causing downstream issues

What to know:
- More 400 errors is expected (catching bugs)
- Error messages are more helpful now
- Report patterns of unexpected errors

Escalation: Backend team
```

## Validation Logic Reference

See `Server/app/utils/validation.py`:
- `@validate_request(Schema)` - Validates JSON body
- `@validate_response(Schema)` - Validates 2xx responses only
- Gradual mode: logs failures, continues
- Strict mode: returns 400 for request failures

## Related Documentation

- OpenAPI spec: `openapi/openapi.yaml`
- Validation decorators: `Server/app/utils/validation.py`
- Schema generation: `Server/scripts/generate-pydantic-models.sh`
- Contract tests: `Server/tests/contract/`
