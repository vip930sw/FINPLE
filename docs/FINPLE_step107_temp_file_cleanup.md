# FINPLE Step 107. 임시 패치 파일 정리

## 목적

베타 운영 전 저장소 루트에 남아 있는 로컬 패치 파일과 백업 파일을 정리합니다.

## 정리 대상

- `apply_step*.cjs` 로컬 패치 파일
- `*.bak_step*` 백업 파일
- `*.bak` 임시 백업 파일
- 루트에 남아 있는 `어플 개발 지원*.txt` 보조 파일

## .gitignore 보강

동일한 임시 파일이 다시 Git 상태에 표시되지 않도록 아래 패턴을 추가합니다.

```gitignore
apply_step*.cjs
*.bak_step*
*.bak
어플 개발 지원*.txt
```

## 실행 결과

- 실행 시각: 2026-05-09T17:34:01.475Z
- 삭제 파일 수: 19

- apply_step100_seo_share_preview.cjs
- apply_step101_2_og_logo_only.cjs
- apply_step101_og_image_preview.cjs
- apply_step102_beta_stability_check_doc.cjs
- apply_step103_error_message_policy.cjs
- apply_step104_url_routing_cleanup.cjs
- apply_step105_2_home_golden_circle_expand.cjs
- apply_step105_3_how_what_default_years.cjs
- apply_step105_4_how_what_width_years_fix.cjs
- apply_step105_5_how_what_wider_layout.cjs
- apply_step105_6_how_title_copy.cjs
- apply_step105_home_golden_circle_copy_guard.cjs
- apply_step106_home_qa_checklist.cjs
- apply_step98_beta_changelog_doc.cjs
- apply_step99_user_faq_doc.cjs
- src\App.css.bak_step82
- src\App.jsx.bak_step82
- src\components\AccountPages.jsx.bak_step82
- vercel.json.bak_step82



## 완료 기준

- `git status --short`에서 `apply_step*.cjs` 파일이 보이지 않음
- `*.bak_step*` 파일이 보이지 않음
- 빌드가 정상 완료됨
