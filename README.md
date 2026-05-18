# FINPLE Portfolio Lab

FINPLE은 사용자가 입력한 포트폴리오 구성과 투자 가정값을 바탕으로 장기 예상 성과, 실질가치, 배당금, 위험 지표를 확인할 수 있는 포트폴리오 분석 웹앱입니다.

현재 상태는 **베타 운영 단계**입니다. 일부 기능과 데이터는 테스트 중이며, 본 서비스는 특정 금융상품의 매수·매도 추천이나 수익 보장을 제공하지 않습니다.

## 운영 주소

| 구분 | 주소 / 경로 | 용도 |
| --- | --- | --- |
| 서비스 메인 | https://finple.co.kr | 사용자 접속 주소 |
| 관리자 로그인 | /admin | 문의사항 관리자 조회 및 상태 변경 |
| 개인정보처리방침 | /privacy | 개인정보 처리 기준 안내 |
| 이용약관 | /terms | 서비스 이용 조건 안내 |
| 투자 유의사항 | /disclaimer | 투자 분석 결과 해석 시 유의사항 |

## 현재 주요 기능

- 포트폴리오 시뮬레이터
- 자산 스크리너
- CAGR / MDD / 배당률 기반 장기 시뮬레이션
- 실질 평가금액 및 연차별 성과 확인
- Free 플랜 기준 포트폴리오 1개 제한
- 서버 저장 / 서버 불러오기
- 문의사항 작성
- 관리자 전용 문의 조회 및 상태 변경
- 개인정보처리방침 / 이용약관 / 투자 유의사항 페이지
- 베타 안내 문구

## 배포 구조

| 영역 | 플랫폼 |
| --- | --- |
| 프론트엔드 | Vercel |
| 백엔드 | Render |
| 데이터베이스 | Supabase |
| 코드 저장소 | GitHub |
| 외부 데이터 | Alpha Vantage 등 서버 API를 통해 조회 |

## 로컬 실행

### 프론트엔드

```powershell
npm install
npm.cmd run dev
```

### 프론트엔드 빌드 확인

```powershell
npm.cmd run build
```

### 백엔드

```powershell
cd server
npm install
npm.cmd start
```

## 환경변수 주의사항

브라우저에 노출되는 `VITE_` 환경변수에는 API Key, DB URL, 관리자 토큰 같은 비밀값을 넣지 않습니다.

서버 비밀값은 Render 환경변수에서 관리합니다.

주요 서버 환경변수 예시는 다음과 같습니다.

```env
NODE_ENV=production
PORT=10000
ASSET_DATA_PROVIDER=alpha_vantage
ALPHA_VANTAGE_API_KEY=...
DATABASE_URL=...
DATABASE_SSL=true
CORS_ORIGIN=https://finple.co.kr,https://www.finple.co.kr
FINPLE_ADMIN_TOKEN=...
```

## Git 작업 기준

작업용 패치 파일은 저장소에 올리지 않습니다.

```powershell
# 권장
git add src/App.jsx src/App.css

# 주의
git add .
```

루트에 남아 있는 `apply_step*.cjs` 파일은 패치 적용 후 삭제해도 됩니다.

## 베타 운영 기준

베타 공개 초기에는 다음 항목을 우선 확인합니다.

- 서비스 접속 가능 여부
- 체험 계정 로그인 흐름
- 포트폴리오 1개 제한
- 서버 저장 / 불러오기
- 문의사항 작성
- 관리자 문의 조회
- 모바일 핵심 화면
- 투자 유의 문구 노출

## 보류 중인 기능

- 실제 이메일 회원가입
- 소셜 로그인
- 실제 결제 / 구독 갱신
- Pro 플랜 고급 기능
- 모바일 시뮬레이터 전용 입력 UI
- 관리자용 문의 삭제 / 숨김 기능
- 사용량 기반 API 제한 고도화

## 운영 문서

자세한 운영 문서는 `docs/` 폴더를 참고합니다.

특히 아래 문서를 우선 확인합니다.

- `docs/FINPLE_step83_prelaunch_checklist.md`
- `docs/FINPLE_step85_user_test_scenarios.md`
- `docs/FINPLE_step86_hold_fix_backlog.md`
- `docs/FINPLE_step87_beta_release_check.md`
- `docs/FINPLE_step89_feedback_collection.md`
- `docs/FINPLE_step90_beta_ops_log.md`
- `docs/FINPLE_step94_beta_feedback_runbook.md`

## 투자 유의사항

FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료입니다.

특정 종목, ETF, 금융상품의 매수·매도 추천이나 투자 자문이 아니며, 과거 데이터와 예상값은 미래 수익을 보장하지 않습니다. 최종 투자 판단과 결과에 대한 책임은 이용자 본인에게 있습니다.
