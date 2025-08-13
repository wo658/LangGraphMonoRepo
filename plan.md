## 1) 소셜로그인(GitHub/Google) 구현 계획

- __아키텍처__: `AuthModule`(Passport: GitHub/Google, JWT 발급), `UsersModule`(유저 upsert/조회), `AiUsageService`(월별 사용량 누적)
- __의존성__: `@nestjs/passport`, `passport-github2`, `passport-google-oauth20`, `@nestjs/jwt`, `@nestjs/mongoose`, `mongoose`
- __환경변수__: `MONGO_URI`, `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `AUTH_CALLBACK_BASE`, `JWT_SECRET`, `FRONTEND_URL`

### 유저 스키마 (MongoDB)
- 경로: `nest-api/src/users/user.schema.ts`
- 필드(최소):
  - `provider: 'github' | 'google'`, `providerId: string`
  - `email?: string`, `name?: string`, `avatarUrl?: string`
  - `aiUsage: { monthKey: string; requestCount: number; tokenCount: number; limits?: { request?: number; tokens?: number } }`
  - `createdAt`, `updatedAt` (timestamps)

### 라우트/플로우
- `GET /auth/github` → OAuth 시작
- `GET /auth/github/callback` → 유저 upsert → JWT 발급(HttpOnly 쿠키) → `FRONTEND_URL` 리다이렉트
- `GET /auth/google`, `GET /auth/google/callback`
- `GET /auth/me`(JWT 가드), `POST /auth/logout`

### AI 사용량 트래킹
- `AiUsageService.increment(userId, { requests?, tokens? }, now)`
- 기준: `monthKey`(YYYY-MM)로 `requestCount/tokenCount` 누적, 초과 시 정책 처리

### 체크리스트
- [ ] Passport 전략(`GithubStrategy`, `GoogleStrategy`), `JwtStrategy`
- [ ] `UsersService.upsertOAuthUser()` 구현(Mongo upsert)
- [ ] 콜백에서 JWT 발급 및 리다이렉트 처리
- [ ] `AiUsageService` 도입 및 AI 엔드포인트 연동
- [ ] e2e: `/auth/*` 플로우, 유닛: 전략 `validate()`
