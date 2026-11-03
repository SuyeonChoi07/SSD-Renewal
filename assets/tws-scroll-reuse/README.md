# TWS 01→02 회전 재사용 파일 — 최신 고정값

> 이 웹페이지에는 원본 ZIP의 실행에 필요한 `model-experience.js`, `rotation-math.mjs`, `tws.glb`만 복사했습니다. Three.js 파일과 라이선스는 `../tws-model-kit/vendor/`의 동일한 버전을 공유합니다. 아래의 standalone·예제·검사 파일은 원본 ZIP에서 확인할 수 있습니다. 이 프로젝트의 Brand 스크롤 구간과 카메라 설정은 루트 `brand-model.js`, `script.js`, `README.md`를 참고하세요.

## 유지한 동작

- 초기 자세: X축 80°.
- 01→02 추가 회전량: X -430° / Y 0° / Z 353°.
- 최고 회전 속도 지점: X축 구간 스크롤 55%, Z축 45%. 일정한 스크롤 속도 기준이며 실제 시간상의 속도는 사용자 스크롤 속도에 따라 달라집니다.
- 카메라: FOV 35°, 위치 (0, 1.833333, 13), 원점 주시. 이전 크기의 약 60%.
- 호버: 객체 표면 위치에 따라 X·Y축 최대 약 6°, Z축 없음. 벗어나면 부드럽게 복귀.
- 조명: 주광70 / 거리15 / 좌우31° / 높이40°, 보조광0.8 / 주변광0.8 / 반사환경0.4 / 노출0.6.
- 모델 위치·크기 고정. 회전 순서는 XYZ이고 초기 자세와 호버는 별도 그룹으로 합성합니다.
- GLB 내장 재질·텍스처 유지. 03섹션, 모델 교체, 축 고리, 카메라 드래그, 옵션창 없음.

## 어떤 파일을 사용하나요?

| 파일 | 역할 / 사용 방법 |
| --- | --- |
| model-experience.js | 핵심 3D ES 모듈. 장면·카메라·조명·GLB 로딩·정렬·회전·호버·리사이즈·정리를 처리합니다. 기존 HTML에서 import해 초기화합니다. |
| rotation-math.mjs | 회전 고정값과 축별 속도 곡선, 구간 진행률 계산. 핵심 모듈이 자동으로 import합니다. 회전량 수정 시 ROTATION_DEGREES를 바꿉니다. |
| model-experience.css | 모델 컨테이너의 전체 화면 고정 위치와 캔버스 스타일. 대상 HTML의 head에서 연결합니다. |
| init.js | 최소 초기화 코드. 컨테이너와 두 섹션 선택자를 자신의 HTML에 맞게 바꿉니다. |
| index.html | 소스 파일 방식의 최소 예제. HTTP 서버에서 열어 importmap과 파일 연결 순서를 확인합니다. |
| standalone.html | 모델·라이브러리·코드·CSS가 내장된 단일 HTML 예제. 현대 브라우저에서 파일을 직접 열 수 있습니다. 소스 방식의 파일을 수정해도 자동 갱신되지 않으므로 다시 빌드해야 합니다. |
| tws.glb | 실제 사용하는 모델과 내장 텍스처. 소스 방식에서 로딩합니다. |
| build-standalone.cjs | node build-standalone.cjs로 standalone.html을 다시 만듭니다. Node.js 표준 모듈만 사용하며 npm 설치가 필요 없습니다. |
| runtime-check.html | 실제 브라우저에서 GLB 로딩·회전 끝값·역방향 스크롤·호버·복귀·자원 해제를 자동 검사합니다. 로컬 HTTP 서버에서 열고 PASS를 확인합니다. 배포 필수 파일은 아닙니다. |
| verify.mjs | node verify.mjs로 구간 진행률, 회전량, 최고 속도 지점, GLB와 내장 의존성을 검사합니다. 배포에 필수는 아닙니다. |
| server.cjs | Node.js 기반 로컬 HTTP 서버입니다. node server.cjs 4180으로 실행합니다. 배포 서버가 있으면 사용하지 않아도 됩니다. |
| start.cmd | Windows에서 서버와 http://127.0.0.1:4180/을 실행합니다. Node.js가 필요합니다. |
| vendor/three.module.js | Three.js 렌더링 라이브러리. three.core.js와 같은 폴더에 유지합니다. |
| vendor/three.core.js | Three.js의 장면·수학·카메라 등 기반 구현. three.module.js에서 사용합니다. |
| vendor/GLTFLoader.js | GLB 로더. importmap으로 연결됩니다. |
| vendor/BufferGeometryUtils.js | GLTFLoader가 상대경로로 불러오는 유틸리티. 같은 폴더에 둡니다. |
| vendor/RoomEnvironment.js | 모델의 반사 환경을 만드는 모듈. importmap으로 연결됩니다. |
| vendor/THREE-LICENSE.txt | Three.js 0.180.0 MIT 라이선스. 재배포 시 유지합니다. |
| README.md | 적용 절차와 API, 파일별 역할을 정리한 설명서입니다. |

## 기존 HTML에 적용하는 방법

폴더 전체를 기존 프로젝트의 `tws-scroll-reuse/`로 복사합니다. 아래 경로는 대상 HTML과 이 폴더가 같은 상위 폴더에 있는 경우입니다.

### 1. head에 CSS와 importmap 추가

```html
<link rel="stylesheet" href="./tws-scroll-reuse/model-experience.css">
<script type="importmap">
{"imports":{
  "three":"./tws-scroll-reuse/vendor/three.module.js",
  "three/addons/loaders/GLTFLoader.js":"./tws-scroll-reuse/vendor/GLTFLoader.js",
  "three/addons/environments/RoomEnvironment.js":"./tws-scroll-reuse/vendor/RoomEnvironment.js"
}}
</script>
```

importmap은 해당 모듈을 불러오는 script보다 먼저 배치합니다. 기존 Three.js importmap이 있다면 하나로 병합하고 같은 버전으로 통일하세요.

### 2. 모델 컨테이너와 두 섹션 지정

```html
<div id="product-3d" class="tws-model-stage"></div>
<section id="intro" style="min-height:100vh">기존 섹션 01</section>
<section id="detail" style="min-height:100vh">기존 섹션 02</section>
```

이미 섹션이 있다면 새로 만들지 말고 기존 ID를 사용합니다. 섹션 상단이 뷰포트 상단에 도달하는 스크롤 위치가 각 구간 경계입니다. 섹션은 문서 흐름에 순서대로 배치하고 전체 페이지의 스크롤 높이를 확보하세요. 내부 스크롤 컨테이너나 sticky 요소 자체를 기준 섹션으로 넘기지 마세요.

### 3. body 끝에서 초기화

```html
<script type="module">
import { createModelExperience } from './tws-scroll-reuse/model-experience.js';
const model = createModelExperience({
  container: '#product-3d',
  sections: ['#intro', '#detail']
});
model.ready.catch(error => {
  console.error(error);
  model.destroy();
});
</script>
```

이 코드를 쓰면 init.js를 추가로 연결하지 않습니다. 또는 init.js의 섹션 선택자를 수정한 후 외부 script로 연결해도 됩니다. 소스 방식은 HTTP 서버가 필요합니다. 직접 파일을 열어 확인하려면 standalone.html을 사용하세요. 단일 HTML을 자신의 레이아웃으로 편집할 수도 있으며 섹션 ID와 초기화 선택자를 함께 맞춰야 합니다.

## API와 화면 배치

```js
const model = createModelExperience({
  container: '#product-3d',
  sections: ['#intro', '#detail'],
  // 생략하면 모듈 옆의 tws.glb 사용. 지정한 상대 URL은 문서 위치 기준입니다.
  modelUrl: '/assets/product.glb',
  onUpdate(state) { /* 필요할 때만 상태 연동 */ }
});
await model.ready;
model.getState();
model.refresh();
model.destroy();
```

- `ready`: 모델 로딩·정렬 완료 Promise.
- `getState()`: ready, progress(두 섹션 사이 0~1), rotation(추가 스크롤 회전), hover 반환. 각도는 라디안입니다. 초기 X 80°는 rotation과 별도로 적용됩니다.
- `refresh()`: 폰트·이미지 등으로 섹션 위치가 달라진 뒤 기준 위치를 다시 계산합니다. resize 때는 자동 처리합니다.
- `destroy()`: 렌더 루프·이벤트·GPU 자원·캔버스 해제. 화면을 제거하는 SPA에서 호출합니다. 중복 호출해도 안전합니다.
- `onUpdate`: 로딩 후 매 프레임 호출됩니다. 기본은 아무 작업도 하지 않습니다.

모델 컨테이너는 전체 화면 고정입니다. 기존 페이지의 레이어 순서에 맞게 z-index를 조정하세요. 장식용 오버레이가 모델을 덮는다면 pointer-events:none, 실제 버튼·링크에는 pointer-events:auto를 지정하면 모델 호버를 방해하지 않습니다. 이 모듈은 주변 텍스트나 설정창을 생성하지 않습니다.

## 제거한 코드

비활성 회전축·TransformControls·OrbitControls 및 관련 이벤트와 직접 회전 초기화, 03섹션·모델 교체 상태, 옵션창·슬라이더·표시 코드, Y축 0°에 곱하던 불필요한 이징 계산, 한 모델용 불필요한 반복문을 제거했습니다. 고정 조명 위치 계산과 속도곡선 계수 계산은 매 프레임 반복하지 않고 초기화 시 한 번만 수행합니다. 에러 처리·리사이즈·자원 해제 코드는 실제로 필요한 코드이므로 유지했습니다.

## 검사

```text
node build-standalone.cjs
node verify.mjs
node --check model-experience.js
node --check init.js
```

검사는 코드와 수치 로직을 확인합니다. 실제 모델 렌더링과 이벤트 처리는 브라우저에서도 별도로 확인해야 합니다.

실행 결과: 수치·구문 검사 통과. 브라우저 runtime-check.html에서 GLB 로딩, 회전 끝값, 역방향 복귀, 호버, 호버 복귀, destroy 검사 PASS 및 오류 로그 없음. standalone.html은 HTTP로 모델 표시 확인. 도구의 file:// 접근 제한으로 파일 직접 열기는 자동 검증하지 못했습니다.

