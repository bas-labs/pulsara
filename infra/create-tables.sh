#!/bin/bash
# Pulsara DynamoDB Tables — Create Script
# Run with: AWS_REGION=us-east-1 bash infra/create-tables.sh

REGION="${AWS_REGION:-us-east-1}"

echo "Creating Pulsara DynamoDB tables in $REGION..."

# 1. Events
aws dynamodb create-table \
  --table-name pulsara-events \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=sport,AttributeType=S \
    AttributeName=eventDate,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=city,AttributeType=S \
    AttributeName=slug,AttributeType=S \
    AttributeName=serialId,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    '[
      {"IndexName":"sport-date-index","KeySchema":[{"AttributeName":"sport","KeyType":"HASH"},{"AttributeName":"eventDate","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"status-date-index","KeySchema":[{"AttributeName":"status","KeyType":"HASH"},{"AttributeName":"eventDate","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"city-date-index","KeySchema":[{"AttributeName":"city","KeyType":"HASH"},{"AttributeName":"eventDate","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"slug-index","KeySchema":[{"AttributeName":"slug","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"serial-date-index","KeySchema":[{"AttributeName":"serialId","KeyType":"HASH"},{"AttributeName":"eventDate","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
    ]' \
  --region $REGION 2>&1 && echo "✅ pulsara-events" || echo "❌ pulsara-events"

# 2. Users
aws dynamodb create-table \
  --table-name pulsara-users \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    '[{"IndexName":"email-index","KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --region $REGION 2>&1 && echo "✅ pulsara-users" || echo "❌ pulsara-users"

# 3. Registrations
aws dynamodb create-table \
  --table-name pulsara-registrations \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=eventId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=bibNumber,AttributeType=N \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    '[
      {"IndexName":"user-event-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"eventId","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"event-status-index","KeySchema":[{"AttributeName":"eventId","KeyType":"HASH"},{"AttributeName":"status","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"event-bib-index","KeySchema":[{"AttributeName":"eventId","KeyType":"HASH"},{"AttributeName":"bibNumber","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
    ]' \
  --region $REGION 2>&1 && echo "✅ pulsara-registrations" || echo "❌ pulsara-registrations"

# 4. Results
aws dynamodb create-table \
  --table-name pulsara-results \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=eventId,AttributeType=S \
    AttributeName=chipTimeSeconds,AttributeType=N \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    '[
      {"IndexName":"event-chiptime-index","KeySchema":[{"AttributeName":"eventId","KeyType":"HASH"},{"AttributeName":"chipTimeSeconds","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"user-results-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
    ]' \
  --region $REGION 2>&1 && echo "✅ pulsara-results" || echo "❌ pulsara-results"

# 5. Serials
aws dynamodb create-table \
  --table-name pulsara-serials \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=slug,AttributeType=S \
    AttributeName=year,AttributeType=N \
    AttributeName=status,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    '[
      {"IndexName":"slug-index","KeySchema":[{"AttributeName":"slug","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"year-status-index","KeySchema":[{"AttributeName":"year","KeyType":"HASH"},{"AttributeName":"status","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
    ]' \
  --region $REGION 2>&1 && echo "✅ pulsara-serials" || echo "❌ pulsara-serials"

# 6. Serial Standings
aws dynamodb create-table \
  --table-name pulsara-serial-standings \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION 2>&1 && echo "✅ pulsara-serial-standings" || echo "❌ pulsara-serial-standings"

# 7. Orders
aws dynamodb create-table \
  --table-name pulsara-orders \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
    AttributeName=stripePaymentIntentId,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    '[
      {"IndexName":"user-orders-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"stripe-index","KeySchema":[{"AttributeName":"stripePaymentIntentId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}
    ]' \
  --region $REGION 2>&1 && echo "✅ pulsara-orders" || echo "❌ pulsara-orders"

# 8. Blog
aws dynamodb create-table \
  --table-name pulsara-blog \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=slug,AttributeType=S \
    AttributeName=category,AttributeType=S \
    AttributeName=publishedAt,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    '[
      {"IndexName":"slug-index","KeySchema":[{"AttributeName":"slug","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},
      {"IndexName":"category-date-index","KeySchema":[{"AttributeName":"category","KeyType":"HASH"},{"AttributeName":"publishedAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
    ]' \
  --region $REGION 2>&1 && echo "✅ pulsara-blog" || echo "❌ pulsara-blog"

echo ""
echo "Done! 8 tables created."
