# FINPLE 업데이트 업무일지 운영 및 인수인계

- 대상 페이지: `https://finple.co.kr/updates`
- 데이터 파일: `src/data/updateWorklogData.js`
- 생성 스크립트: `scripts/generate-updates-worklog.mjs`
- 화면 컴포넌트: `src/components/UpdatesPage.jsx`
- 스타일: `src/App.css`
- 기준 시간대: `Asia/Seoul`

## 1. 목적

업데이트 페이지는 홍보용 버전 요약이 아니라 실제 개발·운영 업무일지로 관리한다.

기록 단위는 다음 순서로 고정한다.

1. 날짜
2. 작업 분야
3. GitHub PR
4. PR 없이 반영된 직접 커밋

큰 버전 항목 하나에 여러 날의 작업을 합치지 않는다. 같은 기능이라도 작업일이나 PR이 다르면 별도 기록으로 남긴다.

## 2. 데이터 생성 방식

업무일지는 Git의 `main` first-parent 이력을 기준으로 생성한다.

- 병합 커밋에 PR 번호가 있으면 PR 항목으로 기록한다.
- 병합 PR의 실제 작업 제목은 두 번째 부모 커밋의 제목을 사용한다.
- PR 없이 `main`에 직접 반영된 커밋은 직접 커밋으로 기록한다.
- 모든 날짜는 커밋 시각을 한국시간으로 변환한다.
- 작업 분야는 생성 스크립트의 `CATEGORY_RULES`로 분류한다.

생성 파일은 직접 편집하지 않는다.

업무일지 개편 PR처럼 아직 `main`에 병합되기 전인 현재 PR도 페이지에 기록해야 할 때는
생성 스크립트의 `SUPPLEMENTAL_PR_RECORDS`에 추가한다. 병합 후 스크립트를 다시 실행하면
PR 번호 기준으로 Git 이력과 중복되지 않는다.

## 3. 갱신 절차

```powershell
git fetch origin
git switch main
git merge --ff-only origin/main
node scripts/generate-updates-worklog.mjs origin/main src/data/updateWorklogData.js
npm.cmd run build
npx.cmd eslint src/components/UpdatesPage.jsx
git diff --check
```

그 다음 아래 파일을 함께 검토한다.

- `src/data/updateWorklogData.js`
- `src/components/UpdatesPage.jsx`
- `docs/FINPLE_updates_worklog_guide.md`

## 4. 기간 변경

기본 시작일은 2026-05-10이며 종료일은 실행 시점의 한국 날짜를 사용한다.

특정 기간만 다시 만들 때는 3·4번째 추가 인자를 사용한다.

```powershell
node scripts/generate-updates-worklog.mjs origin/main src/data/updateWorklogData.js 2026-05-10 2026-06-20
```

새 작업일을 추가할 때는 최신 `main`을 받은 뒤 기본 명령을 다시 실행하면 된다.

## 5. 작업 분야 분류

현재 분류:

- 교육 계정
- 문의·알림
- 결제·구독
- 인증·계정
- 투자 MBTI
- 데이터·스크리너
- 시뮬레이터·분석
- MY PAGE
- 문서·운영
- UI·콘텐츠
- 기타 작업

새 기능군이 생기면 `CATEGORY_RULES`에 구체적인 규칙을 먼저 추가한다. 너무 넓은 정규식을 앞에 두면 다른 작업이 잘못 분류될 수 있으므로, 구체적인 규칙을 위에 둔다.

## 6. 직접 커밋 처리 원칙

2026년 5월 10일과 6월 4~13일에는 PR 병합 외에도 `main` 직접 커밋이 다수 존재한다.

이를 삭제하거나 하나의 버전 항목으로 합치지 않는다. 페이지에서 `직접 커밋 {SHA}`로 표시해 PR 이력과 구분한다.

향후에는 모든 기능 변경을 PR로 진행하는 것이 권장된다. 직접 커밋은 긴급 운영 수정이나 문서 보정 등 예외적인 경우로 제한한다.

## 7. 로드맵 관리

완료된 항목은 로드맵에서 제거하고 업무일지에 남긴다.

로드맵에는 다음 세 종류만 유지한다.

- 운영 검증
- 기능 개선
- 검토

이번 개편에서 추가·정리한 주요 후속 항목:

- 문의 전체 상태 및 관리자 답변 메일 실수신 점검
- 문의 답변 이메일 정규 컬럼과 MY PAGE 답변 이력
- 메일 실패 재발송·감사 로그
- Toss 운영 결제·웹훅 검증
- 데이터 갱신과 만료 사진 삭제 스케줄
- 교육 계정 PDF·디지털 지급

## 8. PR 작성 기준

업데이트 페이지를 수정하는 PR에는 다음을 포함한다.

- 기록 대상 기간
- 추가된 작업일 수
- PR 수와 직접 커밋 수
- 뭉친 기록을 어떻게 분리했는지
- 로드맵 추가·삭제 근거
- 생성 명령과 검증 결과

## 9. 검증 체크리스트

- [ ] 최신 `origin/main` 기준으로 생성했는가
- [ ] 한국시간 날짜가 맞는가
- [ ] PR 번호가 실제 GitHub 링크로 연결되는가
- [ ] 직접 커밋이 PR로 잘못 표시되지 않는가
- [ ] 5월 10일 초기 베타 작업이 날짜별 기록에 포함되는가
- [ ] 6월 4~13일 직접 작업이 날짜별로 분리되는가
- [ ] 완료된 항목이 로드맵에 남아 있지 않은가
- [ ] 프런트 빌드가 통과하는가
- [ ] 모바일에서 날짜 카드와 링크가 읽기 쉬운가

## 10. 다음 작업자 인수인계

업데이트 업무일지 관련 작업을 시작할 때:

1. 이 문서를 먼저 읽는다.
2. 최신 `main`을 동기화한다.
3. 생성 스크립트의 기간을 최신화한다.
4. 생성 파일을 다시 만든다.
5. 자동 분류가 어색한 제목을 확인한다.
6. 로드맵에서 완료·중복 항목을 정리한다.
7. 빌드·ESLint·`git diff --check` 후 PR을 만든다.

생성 데이터 파일을 손으로 고치면 다음 실행에서 사라진다. 예외 기록이 필요하면 생성 스크립트에 명시적인 보정 규칙을 추가한다.
