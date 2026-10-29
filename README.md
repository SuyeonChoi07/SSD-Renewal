# 성심당 브랜드 웹페이지

2026-10-29 Figma 최신 프레임 기준으로 수정했습니다.

- 실행: index.html을 브라우저에서 엽니다.
- HTML/CSS/JavaScript: 모두 index.html에 포함되어 있습니다.
- 원본 이미지와 폰트: assets/
- Figma 출처·프레임·자산 매핑: figma-source.json

## 화면 순서

1. Landing — 2064×1020 / 736:447
2. Intro — 2064×3060 / 738:609
3. History — 2064×1020 / 749:55
4. History_content_start — 2064×1020 / 769:417
5. History_content_mid — 2064×1020 / 775:505
6. History_content_end — 2064×1020 / 775:532
7. bridge_scale — 2064×1020 / 775:559
8. bridge_scale_end — 2064×1020 / 779:633
9. with Daejeon — 2064×1020 / 779:680
10. bridge_fade_1 — 2064×1020 / 779:701
11. bridge_fade_2 — 2064×1020 / 779:737
12. bridge_fade_3 — 2064×1020 / 779:754
13. Table — 2064×1020 / 779:789
14. Table_tilt — 2064×1020 / 779:807
15. Our Way_start — 2064×1020 / 779:823
16. Our Way_mid — 2064×1020 / 779:840
17. Our Way_end — 2064×1878 / 779:854
18. Brand — 2064×7149 / 779:906
19. Contact — 2064×1224 / 780:1338

Our Way_start가 피그마에 동일 위치·동일 내용으로 두 개 있습니다. 중복 화면은 만들지 않고 779:823을 사용했습니다.

## 수정 위치

- 색상: CSS :root의 --black, --beige, --yellow, --orange, --brown
- 화면 내용: HTML의 scene-landing, scene-intro, scene-history, scene-our-way-start, scene-brand 등
- 공통 로고·내비게이션: site-header
- 공통 제품·역사 사진·확대 사진: shared- 접두사의 요소
- 오브젝트 위치/크기: JavaScript motionTracks
- 화면별 스크롤 길이: HTML data-frame-height
- Table_tilt → Our Way_start: transitionWeights 함수의 index===13 조건
- 모바일·모션 감소: body.reading-mode 스타일

## 스크롤 동작

데스크탑은 2064×1020 좌표를 화면 가로·세로에 맞춰 확장합니다. 배경은 브라우저 전체에 object-fit:cover로 채웁니다. Intro(3060), Our Way_end(1878), Brand(7149), Contact(1224)는 한 화면에 축소하지 않고 세로 스크롤 길이를 유지합니다. 공통 헤더는 고정되고, Intro의 제품은 본문 스크롤 동안 고정됩니다. 역사 사진은 이동하면서 선택 사진이 확대되고, 이후 매장 간판이 전체 화면으로 확대됩니다.

Table_tilt → Our Way_start 전환은 앞 45%에서 페이드 아웃, 가운데 10%에서 완전한 검정, 뒤 45%에서 페이드 인합니다. 이 구간에서는 두 화면이 겹치지 않습니다. 역방향도 같은 규칙입니다. 900px 이하 또는 모션 감소 환경은 정적인 읽기 순서로 대체합니다.

## 검사

- node verify.cjs: 19개 순서, 최신 원본 자산 47개, 로컬 자산 참조 52개, HTML 중첩, 앵커, JS 문법 검사 통과
- node verify-motion.cjs: 25건 DOM fixture 검사 통과. 긴 프레임, 공통 오브젝트, 확대, 검정 전환과 역방향, GNB, 모바일 대체, 메뉴/Esc 확인
- 실제 브라우저 시각 검수: 도구의 file: URL 보안 정책으로 차단되어 미수행. 이미지 표시 영역과 모바일 시각 품질은 확인 완료로 간주하지 않습니다.

## 콘텐츠와 링크

카피와 매장 정보는 제공된 피그마를 따랐습니다. 예전 시안의 Lusion 샘플 카피는 최신 프레임에 따라 교체했습니다. 피그마에 적힌 DDC점 등의 표기는 그대로 보존했습니다. Contact의 링크는 공식 쇼핑몰, 메일, 전화 및 기존 공식 사이트에서 확인했던 소셜 URL로 연결합니다. 정책 링크는 공식 사이트에서 확인하는 방식이며 자체 정책 원문이나 신청 전송을 임의로 만들지 않았습니다.

현재 로컬 수정본입니다. 저장소 원격 브랜치 반영 여부는 별도 업로드 결과를 확인하세요.
