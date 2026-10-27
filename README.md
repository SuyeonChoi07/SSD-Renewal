# KBrandRenewalProject — 성심당 프레임 구현

피그마의 `웹페이지 - 화면 1차구성` 페이지에 있는 19개 프레임을 순서대로 구현했습니다.

- 디자인: https://www.figma.com/design/Km3CRMhMnwBl9hw0xiU5Sf/?node-id=705-142
- 시작 파일: **index.html**
- HTML, CSS, JavaScript는 모두 index.html 안에 있습니다. 빌드와 패키지 설치가 필요하지 않습니다.
- 사진·로고·SVG 27개와 Pretendard 폰트는 `assets/`에 있습니다. 임시 Figma URL을 런타임에 사용하지 않습니다.

## 수정하는 곳

| 수정 항목 | index.html에서 찾을 이름 |
|---|---|
| 색상, 폰트 | `:root` |
| 첫 화면 | `.scene-home`, `.home-story-card`, `.home-introduction` |
| 고정 헤더 | `.site-header`, `.brand-home-link`, `.site-nav` |
| 중앙 튀김소보로 | `.shared-bread` |
| 포장된 튀김소보로 | `.shared-wrapped-bread` |
| 빵과 함께 문구 | `.shared-value-title`, `.shared-value-copy` |
| 성심당, 대전의 문화 | `.shared-culture-title` |
| 역사 본문 | `.shared-origin-panel`, `.origin-text` |
| 매장 사진 | `.scene-family` |
| 제품 사진 가로 목록 | `.scene-gallery` |
| 마지막 화면 | `.scene-contact` |
| 화면 사이 크기/위치 | JavaScript의 `motionTracks` |
| 모바일 스타일 | `body.reading-mode` |

`motionTracks` 배열은 `[화면 번호, x, y, 너비, 높이, 투명도]`입니다. 좌표는 1920×1020 피그마 프레임 기준이며, 화면 번호는 0부터 시작합니다. 동일한 좌표를 유지하면 스크롤 중에도 위치가 고정됩니다. 좌표나 크기가 다른 경우 두 상태 사이를 보간합니다.

## 화면 순서

1. Home — 옛 사진과 원형 엠블럼
2. Thisisnt — 빵과 함께 나누는 가치
3. EOC — Powered By DaeJeon / 손과 빵
4. Wearable — 큰 문화 제목과 포장 빵
5. Portable — Family Brand 사진
6. Elevate — 옛 건물과 역사 본문
7. Circular — 건물 드로잉, 본문 고정
8. Name — 큰 워드마크
9. Shot — 트레이 위 포장 빵
10. Flip — 트레이 사진 각도 전환
11. Close up — 포장 확대와 워드마크
12. Tear — 찢어진 포장지
13. Word — 크림 배경의 큰 제목
14. Word — 피그마에 있는 세 개의 색상 패널
15. People — 큰 튀김소보로와 가치 문구
16. Review — 참고 리뷰 레이아웃
17. Review — 제품 사진 목록
18. Choose — 중앙 브랜드 로고
19. Contact — 밀가루 사진과 공유/문의 레이아웃

## 동작

- 데스크탑: 고정된 무대에서 19개 화면을 전환합니다. 같은 로고·빵·제목·역사 본문은 공통 DOM 요소의 크기/좌표/투명도를 변경합니다.
- 900px 이하 및 `prefers-reduced-motion`: 콘텐츠를 정적으로 나열합니다. 가로 갤러리는 손으로 스크롤할 수 있습니다.
- 모바일 메뉴: 열기, 닫기, Esc, 키보드 포커스 순환을 지원합니다.
- GNB: INTRO, FEATURES, PRODUCT, CONTACT로 이동합니다.
- COPY URL: 클립보드 성공/실패 상태를 안내합니다.
- 뉴스레터: 실제 서버가 없는 시안이므로 전송하지 않고 안내를 표시합니다.

## 남아 있는 디자인 원문

피그마 Contact에 있는 Lusion 영문 카피·출처·링크와 Review의 영어 샘플 인용은 원본대로 유지했습니다. 실제 성심당의 고객 후기나 제휴/제작 크레딧으로 검증한 내용이 아닙니다. 실제 공개 전에 브랜드 카피와 크레딧으로 교체해야 합니다. 14번째 프레임은 원본이 빈 색상 패널이므로 임의로 내용을 채우지 않았습니다.

## 확인 결과

```sh
node verify.cjs
node verify-motion.cjs
```

- 19개 프레임, 원본 자산 27개, 자산 참조 32개, 앵커, HTML 중첩, JS 문법 검사 통과.
- DOM fixture 동작 검사 17건 통과: 고정 헤더, 빵 크기 변화, 제목 보간, 역사 본문 고정, 로고 색상, GNB, 모바일 대체, 메뉴와 Esc, 전송 안내.
- 로컬 HTTP 응답 200 확인.
- 브라우저 도구의 로컬 페이지 연결이 시간 초과되어 실제 렌더링, 이미지 유효 표시 영역, 스크롤 시각 품질 및 모바일 화면 검수는 **미완료**입니다. DOM fixture 검사는 시각 검수를 대신하지 않습니다.

이미지 출처와 프레임 매핑은 `figma-source.json`을 확인하세요. Pretendard 라이선스는 `assets/Pretendard-LICENSE.txt`에 있습니다.
