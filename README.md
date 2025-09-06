<div align="center">
  <img src="./docs/favicon.png" alt="LastByte Logo" width="200" height="200">
  
  # 개성넘치는팀이름: 라스트바이트
</div>

<div align="center">
  <img src="./docs/intro.gif" alt="Intro" >

_마지막 한 바이트의 주인공이 되어볼까요?_ 🍕💾

</div>

## 어플리케이션 개요

**LastByte**는 실시간 멀티플레이어 서바이벌 게임으로, 유령에게 쫓기는 플레이어들 중 마지막까지 살아남는 1인이 승리하는 추첨형 게임입니다.

웹 브라우저에서 간편하게 접속하여 친구들과 함께 스릴 넘치는 추격전을 즐길 수 있으며, AWS 클라우드 인프라를 통해 안정적인 실시간 게임 환경을 제공합니다.

### 🎯 어플리케이션의 목적

- 추첨, 랭킹이 필요할 때 쉽고 간편하게 사용한다
- 간단하면서도 긴장감 넘치는 멀티플레이어 게임 경험 제공
- 실시간 웹소켓 통신을 통한 끊김 없는 리액션

## 주요 기능

### 🎮 게임 플레이

- **실시간 멀티플레이어**: 여러 플레이어가 동시에 참여하는 서바이벌 게임
- **유령 추격 시스템**: AI 또는 플레이어가 조작하는 유령이 다른 플레이어들을 추격
- **생존자 승리**: 마지막까지 살아남은 1인이 최종 승리
- **추첨 요소**: 랜덤한 이벤트와 아이템으로 예측 불가능한 재미

### 🌐 실시간 통신

- **리액션 반영**: 플레이어들의 리액션과 게임 보드의 실시간 업데이트
- **안정적인 연결**: AWS API Gateway를 통한 확장 가능한 WebSocket 관리

### 👥 사용자 경험

- **간편한 접속**: 별도 설치 없이 웹 브라우저로 즉시 게임 참여
- **참여형 경험**: 지켜보기만 해야하는 일반 추첨 게임과 달리 리액션을 보낼 수 있음
- **게임 상태 표시**: 실시간 생존자 수, 게임 진행 상황 등 정보 제공

## 동영상 데모

<div align="center">
  <img src="./docs/all.gif" alt="All" >
</div>

## 리소스 배포하기

### AWS 아키텍처

![AWS Architecture](./docs/architecture.svg)

- IAM > 사용자 계정 > 보안 자격 증명 > 엑세스 키 설정

### 사전 준비

1. **AWS CLI 설정**

```bash
# Access Key ID, Secret Access Key, Region(us-east-1) 설정
aws configure
```

2. **Terraform 설치**

```bash
# macOS
brew install terraform

# 또는 공식 사이트에서 다운로드
```

3. **의존성 설치**

```bash
pnpm install
```

### 배포 방법

#### 최초 설정 (팀 리더만 실행)

```bash
# 1. 테라폼 상태 저장용 S3 버킷 생성
aws s3 mb s3://lastbyte-terraform-state --region us-east-1

# 2. 버킷 버전 관리 활성화
aws s3api put-bucket-versioning \
  --bucket lastbyte-terraform-state \
  --versioning-configuration Status=Enabled
```

#### 자동 배포 (권장)

```bash
terraform init
```

최초 배포시 테라폼 세팅을 해줍니다.

```bash
pnpm run iac:publish
```

전체 인프라 배포 및 웹사이트 업로드 진행

#### 수동 배포

```bash
# 1. Terraform 초기화
terraform init

# 2. 인프라 배포
terraform apply

# 3. 웹사이트 빌드
pnpm web build

# 4. S3에 업로드
aws s3 cp apps/website/dist/ s3://$(terraform output -raw s3_bucket_name)/ --recursive
```

### 배포 완료 후 출력 정보

배포가 성공하면 다음 정보들이 출력됩니다:

- **Website URL**: `https://[cloudfront-domain].cloudfront.net`
- **WebSocket URL**: `wss://[api-id].execute-api.us-east-1.amazonaws.com/prod`
- **S3 Bucket Name**: `my-static-website-[random-suffix]`

### 주요 AWS 서비스

| 서비스          | 용도                    | 비용 모델             |
| --------------- | ----------------------- | --------------------- |
| **S3**          | React 앱 정적 파일 저장 | 저장 용량 + 요청 수   |
| **CloudFront**  | CDN, HTTPS 제공         | 데이터 전송량         |
| **API Gateway** | WebSocket 엔드포인트    | 연결 시간 + 메시지 수 |
| **Lambda**      | 실시간 메시지 처리      | 실행 시간 + 요청 수   |
| **DynamoDB**    | 연결 상태 관리          | 읽기/쓰기 요청 수     |

### 리소스 삭제

#### 자동 삭제 (권장)

```bash
pnpm run iac:destroy
```

#### 수동 삭제

```bash
# 1. S3 버킷 내용 삭제
aws s3 rm s3://$(terraform output -raw s3_bucket_name) --recursive

# 2. Terraform 리소스 삭제
terraform destroy

# 3. 생성된 파일 정리
rm -f websocket_handler.zip
```

### 주의사항

- CloudFront 배포는 삭제 시 15-20분 소요될 수 있습니다
- DynamoDB 테이블은 즉시 삭제되지 않을 수 있습니다
- 모든 리소스가 삭제되었는지 AWS 콘솔에서 확인하세요

### 트러블슈팅

**배포 실패 시:**

- AWS 자격 증명 확인: `aws sts get-caller-identity`
- Terraform 상태 확인: `terraform plan`
- 로그 확인: CloudWatch Logs에서 Lambda 로그 확인

**"이미 존재하는 리소스" 에러 시:**

```bash
# 기존 리소스 완전 삭제 후 재배포
terraform destroy -auto-approve
terraform init -reconfigure
terraform apply -auto-approve
```

**WebSocket 연결 실패 시:**

- 브라우저 개발자 도구에서 네트워크 탭 확인
- WebSocket URL이 올바른지 확인
- CORS 설정 확인

## 프로젝트 기대 효과 및 예상 사용 사례

1. 서버리스 실시간 게임 아키텍처 구현

   API Gateway WebSocket + Lambda + DynamoDB 조합으로 확장 가능한 실시간 통신
   자동 스케일링으로 플레이어 수 증가에 대응
   비용 효율적인 pay-per-use 모델

2. IaC(Infrastructure as Code) 자동화

   Terraform으로 전체 인프라 원클릭 배포/삭제
   팀 협업을 위한 S3 백엔드 상태 관리
   개발-운영 환경 일관성 보장

3. 크로스 플랫폼 실시간 동기화

   PC(호스트) <-> 모바일(플레이어) 간 seamless 연동
   WebSocket 연결 관리 및 자동 재연결 로직
   실시간 게임 상태 브로드캐스팅
   유용한 사용 사례

4. 교육/워크샵 환경

   프로그래밍 교육에서 실시간 협업 도구
   AWS 서비스 학습용 실습 프로젝트
   서버리스 아키텍처 데모

5. 팀 빌딩/이벤트

   회사 워크샵이나 팀 빌딩 활동
   컨퍼런스나 해커톤 아이스브레이킹
   온라인 모임에서 실시간 게임

6. 기술 레퍼런스

   실시간 멀티플레이어 게임 개발 참고 사례
   AWS 서비스 통합 활용 예제
   WebSocket 기반 실시간 통신 구현 가이드

7. 상업적 활용

   카페나 PC방에서 고객 참여형 게임
   마케팅 이벤트용 인터랙티브 콘텐츠
   교육 기관의 학습 도구

### 핵심 가치

- 접근성: QR코드 스캔만으로 즉시 참여 가능
- 확장성: 서버리스 아키텍처로 자동 스케일링
- 비용 효율성: 사용한 만큼만 과금되는 AWS 서비스 활용
- 개발 생산성: Terraform 자동화로 인프라 관리 간소화

---
