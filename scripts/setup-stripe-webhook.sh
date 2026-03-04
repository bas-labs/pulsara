#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# setup-stripe-webhook.sh
#
# Finds the deployed stripe-webhook Lambda function URL and
# registers it as a Stripe webhook endpoint. Saves the signing
# secret back into Amplify secrets.
#
# Usage:
#   ./scripts/setup-stripe-webhook.sh sandbox
#   ./scripts/setup-stripe-webhook.sh production
#
# Requires:
#   - AWS CLI configured with correct profile/region
#   - STRIPE_SECRET_KEY env var (or pass via --stripe-key)
# ─────────────────────────────────────────────────────────────

ENV="${1:-sandbox}"

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "ERROR: STRIPE_SECRET_KEY env var is required."
  echo "  export STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)"
  exit 1
fi

echo "==> Environment: $ENV"

# 1. Find the stripe-webhook Lambda function
echo "==> Finding stripe-webhook Lambda function..."
FUNCTION_NAME=$(aws lambda list-functions \
  --query "Functions[?contains(FunctionName, 'stripe-webhook')].FunctionName" \
  --output text | tr '\t' '\n' | grep -i "$ENV" | head -1)

# If env-specific match fails, fall back to any stripe-webhook function
if [[ -z "$FUNCTION_NAME" ]]; then
  FUNCTION_NAME=$(aws lambda list-functions \
    --query "Functions[?contains(FunctionName, 'stripe-webhook')].FunctionName" \
    --output text | tr '\t' '\n' | head -1)
fi

if [[ -z "$FUNCTION_NAME" ]]; then
  echo "ERROR: Could not find a Lambda function containing 'stripe-webhook'."
  echo "  Make sure you've deployed first: npx ampx sandbox (or pushed to main)."
  exit 1
fi

echo "    Found: $FUNCTION_NAME"

# 2. Get or create the function URL
echo "==> Getting function URL..."
WEBHOOK_URL=$(aws lambda get-function-url-config \
  --function-name "$FUNCTION_NAME" \
  --query 'FunctionUrl' --output text 2>/dev/null || echo "")

if [[ -z "$WEBHOOK_URL" || "$WEBHOOK_URL" == "None" ]]; then
  echo "    No Function URL found. Creating one..."
  WEBHOOK_URL=$(aws lambda create-function-url-config \
    --function-name "$FUNCTION_NAME" \
    --auth-type NONE \
    --query 'FunctionUrl' --output text)

  # Allow public invocation via the function URL
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id FunctionURLAllowPublicAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE 2>/dev/null || true
fi

if [[ -z "$WEBHOOK_URL" || "$WEBHOOK_URL" == "None" ]]; then
  echo "ERROR: Failed to get or create Function URL for '$FUNCTION_NAME'."
  exit 1
fi

echo "    URL: $WEBHOOK_URL"

# 3. Check if a Stripe webhook endpoint already exists for this URL
echo "==> Checking for existing Stripe webhook endpoint..."
EXISTING_ENDPOINT_ID=$(curl -s https://api.stripe.com/v1/webhook_endpoints?limit=100 \
  -u "$STRIPE_SECRET_KEY:" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
url = '$WEBHOOK_URL'.rstrip('/')
for ep in data.get('data', []):
    if ep.get('url', '').rstrip('/') == url:
        print(ep['id'])
        break
" 2>/dev/null || echo "")

if [[ -n "$EXISTING_ENDPOINT_ID" ]]; then
  echo "    Found existing endpoint: $EXISTING_ENDPOINT_ID"
  echo "==> Updating existing Stripe webhook endpoint..."
  RESPONSE=$(curl -s https://api.stripe.com/v1/webhook_endpoints/"$EXISTING_ENDPOINT_ID" \
    -u "$STRIPE_SECRET_KEY:" \
    -d "enabled_events[]"="checkout.session.completed" \
    -d "url=$WEBHOOK_URL")
else
  echo "    No existing endpoint found. Creating new one..."
  RESPONSE=$(curl -s https://api.stripe.com/v1/webhook_endpoints \
    -u "$STRIPE_SECRET_KEY:" \
    -d "url=$WEBHOOK_URL" \
    -d "enabled_events[]"="checkout.session.completed" \
    -d "description=Al Fallo $ENV webhook" \
    -d "api_version=2026-02-25.clover")
fi

# 4. Extract the signing secret
WEBHOOK_SECRET=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'error' in data:
    print('ERROR: ' + data['error'].get('message', 'Unknown error'), file=sys.stderr)
    sys.exit(1)
print(data.get('secret', ''))
")

ENDPOINT_ID=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('id', ''))
")

if [[ -z "$WEBHOOK_SECRET" ]]; then
  echo "    Webhook updated (signing secret only shown on creation)."
  echo "    Endpoint ID: $ENDPOINT_ID"
  echo ""
  echo "NOTE: If you need to rotate the secret, delete the endpoint in Stripe"
  echo "  Dashboard and re-run this script."
else
  echo "    Endpoint ID: $ENDPOINT_ID"
  echo "    Signing secret: $WEBHOOK_SECRET"

  # 5. Save the signing secret to Amplify
  echo "==> Saving STRIPE_WEBHOOK_SECRET to Amplify..."
  if [[ "$ENV" == "sandbox" ]]; then
    npx ampx sandbox secret set STRIPE_WEBHOOK_SECRET <<< "$WEBHOOK_SECRET"
  else
    # WARNING: For production, set STRIPE_WEBHOOK_SECRET via AWS SSM Parameter Store or Amplify console, not via sandbox command
    echo "WARNING: For production, set STRIPE_WEBHOOK_SECRET via AWS SSM Parameter Store or Amplify console, not via sandbox command"
    echo "    Webhook signing secret: $WEBHOOK_SECRET"
    echo "    Set this value in the Amplify console under your app > Hosting > Environment variables / Secrets."
  fi
fi

echo ""
echo "==> Done! Stripe webhook is configured."
echo "    Endpoint: $WEBHOOK_URL"
echo "    Listening for: checkout.session.completed"
