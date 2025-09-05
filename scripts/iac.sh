#!/bin/bash

set -e

echo "🚀 Starting deployment..."

echo "📦 Applying Terraform..."
terraform apply -auto-approve

echo "🏗️ Building website..."
pnpm web build

echo "☁️ Uploading to S3..."
aws s3 cp apps/website/dist/ s3://my-static-website-c619wrju/ --recursive

echo "✅ Deployment complete!"