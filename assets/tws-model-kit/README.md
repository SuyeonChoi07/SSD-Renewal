# TWS 3D 재사용 패키지

이 폴더를 통째로 복사하면 외부 CDN 없이 실행할 수 있습니다. Node.js가 설치된 환경에서 `start.cmd`를 실행하고 http://127.0.0.1:4173 에 접속합니다. 다른 서버가 4173 포트를 사용 중이면 기존 서버를 종료하거나 `server.cjs`와 `start.cmd`의 포트를 함께 바꾸세요. HTML을 더블클릭하는 file:// 방식 대신 HTTP 서버를 사용해야 합니다.

## 파일별 역할

| 파일 | 기능과 사용법 |
| --- | --- |
| model-experience.js | 3D 전용 ES 모듈. createModelExperience()를 import해 실행합니다. 카메라·조명·GLB 로딩·크기 및 중심 정렬·축별 스크롤 회전·모델 교체·호버·리사이즈·해제를 처리합니다. 페이지 텍스트나 설정창에 의존하지 않습니다. |
| model-experience.css | 고정된 전체 화면 캔버스를 위한 클래스. 모델 컨테이너에 tws-model-stage를 지정합니다. |
| example.js | 최소 초기화 예제. 컨테이너와 3개 섹션 선택자를 지정하고 로딩 실패를 처리합니다. |
| index.html | 바로 실행할 수 있는 예제. importmap, 모델 컨테이너, 세 섹션, 모듈 연결 순서를 보여줍니다. |
| tws.glb | 처음 표시하는 모델. 포함된 머티리얼과 텍스처를 사용합니다. |
| tws_w_o.glb | 두 번째 모델. 02→03 추가 Y축 회전이 -270°가 되면 표시합니다. |
| vendor/three.module.js | Three.js 렌더링 모듈. three.core.js를 함께 둡니다. |
| vendor/three.core.js | 장면·카메라·수학·재질 등 Three.js 기반 구현입니다. |
| vendor/GLTFLoader.js | GLB 로더. BufferGeometryUtils.js를 같은 폴더에서 참조합니다. |
| vendor/BufferGeometryUtils.js | 로더가 사용하는 지오메트리 변환 유틸리티입니다. |
| vendor/RoomEnvironment.js | 모델의 반사에 사용할 실내 환경 생성기입니다. |
| vendor/THREE-LICENSE.txt | 포함된 Three.js 0.180.0의 MIT 라이선스. 배포 시 유지합니다. |
| server.cjs | Node.js 표준 모듈만 사용하는 로컬 HTTP 서버. 해당 폴더만 제공합니다. |
| start.cmd | Windows에서 서버와 브라우저를 실행합니다. Node.js 필요. |

## 다른 HTML에 적용

1. 이 폴더를 기존 프로젝트의 `tws-model-kit/`로 복사합니다.
2. 대상 HTML의 head에 아래 CSS와 importmap을 추가합니다. importmap은 이를 사용하는 module 스크립트보다 먼저 나와야 합니다. 이미 Three.js용 importmap이 있다면 기존 맵에 병합하고 버전을 통일하세요.

```html
<link rel="stylesheet" href="./tws-model-kit/model-experience.css">
<script type="importmap">
{"imports":{
  "three":"./tws-model-kit/vendor/three.module.js",
  "three/addons/loaders/GLTFLoader.js":"./tws-model-kit/vendor/GLTFLoader.js",
  "three/addons/environments/RoomEnvironment.js":"./tws-model-kit/vendor/RoomEnvironment.js"
}}
</script>
```

3. body에 모델 컨테이너를 추가하고 기존 세 섹션에 ID를 지정합니다.

```html
<div id="product-3d" class="tws-model-stage"></div>
<!-- 기존 페이지의 세 섹션 -->
<section id="intro">...</section>
<section id="detail">...</section>
<section id="finish">...</section>
```

4. body 끝에서 초기화합니다.

```html
<script type="module">
import { createModelExperience } from './tws-model-kit/model-experience.js';
const model = createModelExperience({
  container: '#product-3d',
  sections: ['#intro', '#detail', '#finish']
});
model.ready.catch(error => {
  console.error(error);
  model.destroy();
});
</script>
```

컨테이너 및 섹션에는 선택자 문자열 대신 실제 HTMLElement도 전달할 수 있습니다. 섹션은 문서 흐름에 위에서 아래로 배치하고 충분한 스크롤 높이를 확보하세요. 섹션 상단이 화면 상단에 도달하는 위치를 구간 경계로 사용합니다. 예제는 각각 100vh입니다. 고정되거나 sticky인 요소 자체를 기준 섹션으로 넘기지 마세요. 페이지 전체의 세로 스크롤(window.scrollY)을 기준으로 하며 내부 스크롤 박스는 지원하지 않습니다.

컨테이너는 전체 화면 고정 방식입니다. 상위 콘텐츠가 캔버스를 덮는 경우 호버 입력도 가려질 수 있습니다. 장식용 오버레이에는 pointer-events:none, 실제 버튼·링크에는 pointer-events:auto를 설정하세요. 사용자 콘텐츠의 클래스나 기본 CSS를 모듈이 바꾸지는 않습니다.

## API

```js
const model = createModelExperience({
  container: '#product-3d',
  sections: ['#intro', '#detail', '#finish'],
  // 생략 시 이 모듈 옆의 tws.glb / tws_w_o.glb를 사용합니다.
  modelUrls: ['/models/tws.glb', '/models/tws_w_o.glb'],
  onUpdate(state) { /* 필요할 때 상태를 외부 UI나 로직에 전달 */ }
});
await model.ready;
const state = model.getState();
model.destroy();
```

`ready`는 두 GLB의 로딩·정렬 완료를 알리는 Promise입니다. `getState()`는 ready, 전체 스크롤 progress, sectionProgress(01→02), swapProgress(02→03), swapDegrees, model(original/alternate), rotation 및 hover를 반환합니다. rotation과 hover의 단위는 라디안이며 초기 X축 80°는 별도 그룹에 적용됩니다. `onUpdate`는 로딩 완료 후 매 프레임 호출되므로 가벼운 작업만 연결하세요. `destroy()`는 렌더 루프와 이벤트, GPU 자원, 캔버스를 해제하며 여러 번 호출해도 안전합니다.

## 유지된 동작과 변경 위치

- 초기 X축: 80°. `rig.rotation.x`에서 수정합니다.
- 01→02: X 350° / Y 0° / Z 360°. `scrollRotation`에서 수정합니다.
- 축별 속도: X축은 구간 55%, Z축은 45%에서 최고 속도. `axisScrollEase()`의 Beta 누적 곡선을 사용합니다. 일정한 스크롤 속도일 때의 기준입니다.
- 02→03: Y -360°. 코사인 ease-in-out으로 회전합니다.
- 모델 전환: 두 번째 구간의 회전 진행률 0.75(-270°)에서 표시 여부를 교체합니다. 실제 스크롤 위치는 두 번째 구간 약 66.7%입니다. 역방향에서도 복귀합니다.
- 호버: 실제 모델 표면의 좌우·상하 위치에 따라 Y·X축 최대 약 6° 기울기, Z축 없음. 벗어나면 부드럽게 복귀합니다. 동작 줄이기 설정에서는 호버를 생략합니다.
- 카메라: FOV 35°, 위치 (0,1.1,7.8), 원점 주시. 드래그 조작 없음.
- 모델 크기: 기존 모델의 가장 긴 변을 2.5로 정규화하고 두 모델에 동일한 배율 적용. 각 모델 중심은 원점 정렬.
- 조명: 주광 70 / 거리15 / 좌우31° / 높이40°, 보조광0.8, 주변광0.8, 반사환경0.4, 노출0.6.
- GLB 내부 재질·텍스처 유지. 봉투와 아이코스피어의 개별 이동은 적용하지 않습니다.

## 제거한 코드

AxesHelper, TransformControls와 조작 고리, 직접 회전 초기화·각도 표시·이벤트 처리 및 dragging 조건을 제거했습니다. 이 패키지에는 TransformControls.js와 OrbitControls.js를 포함하지 않습니다. 실제 모델 파일은 두 개만 포함합니다.
