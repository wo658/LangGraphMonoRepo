

의존성 설치
cd nest-api
npm ci
빌드
npm run build
배포(prd)
npm run sls:deploy:prd
엔드포인트 확인
npm run sls:info
출력되는 API Gateway HTTP API URL을 사용하세요. 기존 “Function URL”과 다릅니다.
테스트
curl -i https:///api-docs
로그 실시간 확인
npx serverless logs -f api -s prd -t

---

# 커스텀 도메인으로 배포하기 (api.langvis.com)

아래 절차는 Serverless(HTTP API)로 배포된 Lambda에 `api.langvis.com` 커스텀 도메인을 연결하는 방법입니다. 현재 `serverless.yml`의 리전은 `us-east-1`이므로, 인증서(ACM)와 API Gateway 커스텀 도메인도 같은 리전(`us-east-1`)에서 진행합니다.

## 0) 재배포 전 환경값 정리 (Doppler `prd`)
- `AUTH_CALLBACK_BASE=https://api.langvis.com`
- `FRONTEND_URL=https://langvis.com` (또는 `FRONTEND_URLS`에 여러 개 쉼표 구분)
- `MONGO_URI`, `JWT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `OPENROUTER_API_KEY` (선택)

## 1) ACM 인증서 발급 (us-east-1)
1. 콘솔: AWS Certificate Manager(ACM) → Request a certificate → Request a public certificate
2. 도메인: `api.langvis.com`
3. 검증: DNS validation 선택 → Route53 호스팅 존이 있다면 레코드 자동 생성 → 상태가 "Issued"가 될 때까지 대기

## 2) API Gateway 커스텀 도메인 연결 (Serverless 자동화)

- 플러그인 설치(개발 의존성):
  ```bash
  npm i -D serverless-domain-manager
  ```
- `serverless.yml`에는 이미 다음이 반영되어 있습니다:
  - `plugins: [serverless-esbuild, serverless-domain-manager]`
  - `custom.customDomain`: `api.langvis.com`, `stage: prd`, `createRoute53Record: true`, `apiType: http`
  - 배포 전 ACM 인증서(`api.langvis.com`)가 같은 리전(us-east-1)에 "Issued" 상태여야 합니다.
- 실행(도메인 생성 → 배포 → 정보 확인):
  ```bash
  npx serverless create_domain --stage prd
  npm run sls:deploy:prd
  npm run sls:info
  ```
  - 삭제 시: `npx serverless delete_domain --stage prd`

## 3) 재배포 순서 (요약)
```bash
cd nest-api
npm ci
npm run build
# (플러그인 사용 시) npx serverless create_domain --stage prd
npm run sls:deploy:prd
```

배포 완료 후, `https://api.langvis.com/api-docs` 로 접근해 동작을 확인하세요.

## 4) 패키지 사이즈 초과(> 250MB) 에러 대응
에러 예: "Unzipped size must be smaller than 262144000 bytes"

- 가장 확실한 해결: esbuild 번들 사용(권장)
  1) 설치
     ```bash
     npm i -D serverless-esbuild esbuild
     ```
  2) `serverless.yml`에 추가(예시)
     ```yaml
     plugins:
       - serverless-esbuild

     custom:
       esbuild:
         bundle: true
         minify: true
         target: node20
         platform: node
         sourcemap: false
         external:
           - mongoose
           - swagger-ui-express
     ```
  3) 패키징 규칙 정리
     - `package.patterns`에서 `node_modules/**` 포함을 제거하고, esbuild 번들에 의존
     - 핸들러는 `dist/lambda.handler` 그대로 사용(빌드 타겟 유지)
  4) 재배포
     ```bash
     npm run sls:deploy:prd
     ```

- 간단 차선책(빠른 시도)
  - 배포 전에 프로덕션 의존성만 남기기:
    ```bash
    npm ci --omit=dev
    npm run build
    npm run sls:deploy:prd
    ```
  - 불필요 대형 라이브러리 제거/외부화(레이어 사용)도 고려

## 5) 참고
- 리전을 서울로 바꾸려면 `serverless.yml`의 `provider.region`을 `ap-northeast-2`로 변경하고, ACM 인증서도 같은 리전에 발급하세요.
- `AUTH_CALLBACK_BASE`가 커스텀 도메인과 일치해야 OAuth/리다이렉트가 정상 동작합니다.