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

모든 프레임은 화면 높이와 관계없이 1,500px씩 배정됩니다. 첫 1,250px는 해당 프레임을 유지하고 마지막 250px에서 다음 프레임으로 전환합니다. Intro, Our Way_end, Brand, Contact처럼 긴 원본 프레임은 같은 구간에서 아래쪽까지 이동합니다. 전체 구간은 28,500px입니다.

Table_tilt → Our Way_start에서는 이전 화면이 검정으로 페이드 아웃되고 검정 화면을 거쳐 다음 화면이 페이드 인됩니다. 역방향도 동일합니다.

원본의 가로·세로 비율을 유지합니다. 작은 화면에서도 별도 모바일 요소를 복제하거나 원본과 다른 배치로 바꾸지 않습니다.

## 검사

- `node verify.cjs`: 19개 순서, 원본 레이어 493개 순서, 이미지 슬롯 103개, 로컬 원본 자산 47개, HTML 중첩, 앵커, JavaScript 문법 확인.
- `node verify-motion.cjs`: 19개 프레임의 1,500px 경계, 긴 프레임 이동 범위, 검정 페이드와 역방향 전환 확인.
- 실제 브라우저 시각 검수는 Computer Use가 현재 URL을 확인할 수 없어 중단되었습니다. 위 검사는 픽셀 단위 렌더링 일치를 증명하지 않습니다. Figma의 GLASS 효과는 CSS backdrop blur로 대응합니다.

원본: https://www.figma.com/design/Km3CRMhMnwBl9hw0xiU5Sf/?node-id=705-142

저장소: https://github.com/SuyeonChoi07/SSD-Renewal
