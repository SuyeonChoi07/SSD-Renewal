# 성심당 브랜드 웹페이지

Figma의 지정된 19개 프레임을 원본 HTML 레이어와 CSS로 구현한 정적 웹사이트입니다.

## 수정할 파일

- `index.html`: 프레임별 요소, 문구, 이미지, 링크. 각 구간에 프레임 이름과 원본 `data-node-id`가 있습니다.
- `styles.css`: 레이어별 위치, 크기, 색상, 폰트, 효과. `f01`은 Landing, `f02`는 Intro이며 프레임별 주석으로 구분됩니다.
- `script.js`: 스크롤 구간과 화면 전환.
- `assets/`: Figma 원본 이미지, SVG, Pretendard 폰트.
- `figma-source.json`: 원본 프레임, 레이어 ID 순서, 이미지 슬롯 매핑.

설치나 빌드 없이 `index.html`을 브라우저에서 열면 실행됩니다.

## 화면 순서

Landing → Intro → History → History_content_start → History_content_mid → History_content_end → bridge_scale → bridge_scale_end → with Daejeon → bridge_fade_1 → bridge_fade_2 → bridge_fade_3 → Table → Table_tilt → Our Way_start → Our Way_mid → Our Way_end → Brand → Contact

## 스크롤

각 화면의 내부 스크롤을 먼저 진행합니다. 화면 끝에 도착하면 마지막 위치와 투명도를 1,500px 스크롤 동안 그대로 유지하고, 그 이후 별도의 250px 구간에서 다음 화면으로 전환합니다. Landing → Intro는 유지 구간을 적용하지 않습니다.

Table_tilt → Our Way_start에서는 이전 화면이 검정으로 페이드 아웃되고 검정 화면을 거쳐 다음 화면이 페이드 인됩니다. 역방향도 동일합니다.

원본의 가로·세로 비율을 유지합니다. 작은 화면에서도 별도 모바일 요소를 복제하거나 원본과 다른 배치로 바꾸지 않습니다.

## 검사

- `node verify.cjs`: 19개 순서, 원본 레이어 493개 순서, 이미지 슬롯 103개, 로컬 원본 자산 47개, HTML 중첩, 앵커, JavaScript 문법 확인.
- `node verify-motion.cjs`: Landing 유지 구간 제외, 나머지 18개 화면의 내부 스크롤 완료 후 1,500px 고정, 긴 프레임 이동 범위, 검정 페이드와 역방향 전환 확인.
- 실제 브라우저 시각 검수는 Computer Use가 현재 URL을 확인할 수 없어 중단되었습니다. 위 검사는 픽셀 단위 렌더링 일치를 증명하지 않습니다. Figma의 GLASS 효과는 CSS backdrop blur로 대응합니다.

원본: https://www.figma.com/design/Km3CRMhMnwBl9hw0xiU5Sf/?node-id=705-142

저장소: https://github.com/SuyeonChoi07/SSD-Renewal

## Intro 연출

첫 소개 문구는 Landing과 같은 원본 좌표(1340, 488)에 있습니다. 빵은 내부 스크롤의 76%까지 화면 중앙에서 고정되며 마지막 24% 구간에 아래로만 이동합니다. 손 이미지는 오른쪽으로 21px 이동하여 빵 중심과 맞췄습니다. 빵은 내부 스크롤에 따라 시계방향으로 한 바퀴 회전합니다. 왼쪽 하단의 노란 그라데이션은 Intro 시작부터 고정 표시됩니다. 모션 감소 설정에서는 회전을 생략합니다. 좌우 문구는 스크롤을 따라 이동하지 않고, 같은 자리에서 줄마다 아래에서 슬라이드·페이드 인되고 위로 슬라이드·페이드 아웃됩니다. 마지막 문구와 빵의 착지 상태는 화면 끝의 1,500px 유지 구간에도 고정됩니다. 추가 요소나 이미지 복제는 없습니다.

## 공통 헤더

Landing의 원본 로고와 내비게이션을 공통 헤더로 이동했습니다. 긴 콘텐츠와 화면 전환의 영향을 받지 않고 상단에 고정됩니다. Landing → Intro 구간에서 로고가 365.299×147에서 124×50으로 부드럽게 줄어들고, 밝은 Our Way_end 화면에서는 검정 로고·메뉴로 전환됩니다. 활성 메뉴 밑줄도 화면 전환에 맞춰 교차 전환됩니다. 본문 중앙 워드마크와 Brand 하단 로고는 그대로 유지됩니다.
