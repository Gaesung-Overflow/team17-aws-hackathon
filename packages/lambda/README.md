# AWS 정적 웹사이트 + WebSocket 인프라

## 아키텍처

- **S3 + CloudFront**: 정적 웹사이트 호스팅
- **API Gateway WebSocket + Lambda**: 실시간 소켓 통신
- **DynamoDB**: WebSocket 연결 관리

## 배포 방법

0. 패키지 설치

```bash
npm i
```

`packages/lambda`에서 `npm i`로 설치합니다.

람다 전체를 `zip` 파일로 만들기 때문에 `pnpm` 의 파일 시스템을 우회해서 `node_modules`가 정상적으로 포함되도록 합니다.

1. AWS CLI 설정

```bash
aws configure
```

2. Terraform 초기화 및 배포

```bash
terraform init
# terraform plan
terraform apply
```

3. 정적 파일 업로드

```bash
aws s3 cp example/index.html s3://$(terraform output -raw s3_bucket_name)/
```

4. 출력된 URL 확인

- Website URL: CloudFront 도메인
- WebSocket URL: API Gateway WebSocket 엔드포인트

## 사용법

1. `example/index.html`에서 WebSocket URL 수정
2. 브라우저에서 여러 탭으로 테스트
3. 메시지 전송 시 다른 연결된 클라이언트에게 브로드캐스트됨
