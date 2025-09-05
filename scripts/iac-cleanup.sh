#!/bin/bash

set -e

echo "🔍 현재 Terraform 상태 확인 중..."
terraform plan -destroy

echo ""
read -p "⚠️  위 리소스들을 삭제하시겠습니까? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 삭제가 취소되었습니다."
    exit 0
fi

echo "🧹 AWS 리소스 정리 시작..."

# S3 버킷 내용 삭제
echo "📦 S3 버킷 내용 삭제 중..."
BUCKET_NAME=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
if [ ! -z "$BUCKET_NAME" ]; then
    echo "버킷 이름: $BUCKET_NAME"
    aws s3 rm s3://$BUCKET_NAME --recursive --quiet || true
    echo "✅ S3 버킷 내용 삭제 완료"
fi

# CloudFront 배포 비활성화 대기 (선택사항)
echo "⏳ CloudFront 배포 상태 확인 중..."
sleep 5

# Terraform destroy 실행
echo "🔥 Terraform 리소스 삭제 중..."
terraform destroy

# 생성된 파일들 정리
echo "🗑️  생성된 파일 정리 중..."
rm -f websocket_handler.zip
echo "✨ 정리 완료!"

echo ""
echo "📋 aws cli로 리소스 질의 및 검증 시작"
echo "- CloudFront 배포가 완전히 삭제되었는지 확인"
CLOUDFRONT_RESULT=$(aws cloudfront list-distributions --query 'DistributionList.Items[].Id' --output text)
if [ -z "$CLOUDFRONT_RESULT" ]; then
    echo "CloudFront 배포: 없음"
else
    echo "CloudFront 배포: $CLOUDFRONT_RESULT"
fi

echo "- S3 버킷이 완전히 삭제되었는지 확인"
S3_RESULT=$(aws s3 ls)
if [ -z "$S3_RESULT" ]; then
    echo "S3 버킷: 없음"
else
    echo "S3 버킷 목록:"
    echo "$S3_RESULT"
fi

echo "- DynamoDB 테이블이 삭제되었는지 확인"
DYNAMO_RESULT=$(aws dynamodb list-tables --query 'TableNames' --output text)
if [ -z "$DYNAMO_RESULT" ]; then
    echo "DynamoDB 테이블: 없음"
else
    echo "DynamoDB 테이블: $DYNAMO_RESULT"
fi
