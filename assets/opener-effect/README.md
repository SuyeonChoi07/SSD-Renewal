# Opener GLB Effect

> 이 프로젝트에서는 루트 `opener-model.js`가 `wheel:false`로 초기화하고 기존 2,000px 스크롤을 직접 연결합니다. Three.js는 페이지의 기존 로컬 import map을 사용하며, 레이어 위치는 루트 `styles.css`에서 지정합니다. 아래 예시는 패키지를 단독으로 실행할 때의 설명입니다.

`opener.glb`의 위·아래 메시를 버텍스 셰이더로 벌리고 말아 올리는 Three.js 효과입니다. 패키지에는 배경, 문구, 진행 UI가 포함되지 않습니다.

## 파일 구성

```text
opener-effect-package/
├─ assets/
│  └─ opener.glb
├─ opener-effect.js
├─ opener-effect.css
├─ example.html
└─ README.md
```

## 실행 방법

GLB와 ES Module은 브라우저 보안상 HTML 더블클릭 방식으로 정상 로드되지 않을 수 있습니다. Live Server 같은 로컬 웹 서버에서 `example.html`을 여세요.

## 다른 HTML에 넣기

먼저 CSS와 Three.js import map을 `<head>`에 추가합니다.

```html
<link rel="stylesheet" href="./opener-effect/opener-effect.css" />

<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
    }
  }
</script>
```

효과가 들어갈 위치에 컨테이너를 추가합니다.

```html
<div id="opener" class="opener-effect"></div>
```

컨테이너의 크기와 위치는 사용하는 페이지에서 지정합니다.

```css
#opener {
  position: fixed;
  inset: 0;
  z-index: 10;
}
```

마지막으로 모듈을 불러옵니다.

```html
<script type="module">
  import { createOpenerEffect } from "./opener-effect/opener-effect.js";

  const effect = await createOpenerEffect({
    container: document.querySelector("#opener"),
    modelUrl: "./opener-effect/assets/opener.glb",
    wheel: true
  });
</script>
```

## 옵션

- `container`: 효과를 렌더링할 HTML 요소. 필수입니다.
- `modelUrl`: `opener.glb` 경로입니다. 기본값은 `./assets/opener.glb`입니다.
- `wheel`: 휠로 열고 닫을지 결정합니다. 기본값은 `true`입니다.
- `wheelSpeed`: 휠 진행 속도입니다. 기본값은 `0.00075`입니다.
- `pixelRatio`: 최대 픽셀 비율입니다. 기본값은 `2`입니다.

## 직접 진행도 제어

GSAP ScrollTrigger 같은 외부 스크롤 도구를 사용할 때는 휠 기능을 끄고 `setProgress()`를 호출합니다.

```js
const effect = await createOpenerEffect({
  container: document.querySelector("#opener"),
  modelUrl: "./opener-effect/assets/opener.glb",
  wheel: false
});

effect.setProgress(0.75); // 0: 닫힘, 1: 완전히 열려 사라짐
```

## 제공 메서드

- `setProgress(value)`: 0~1 범위의 목표 진행도를 설정합니다.
- `getProgress()`: 현재 보간된 진행도를 반환합니다.
- `resize()`: 컨테이너 크기를 다시 측정합니다.
- `destroy()`: 이벤트, 애니메이션 프레임, WebGL 리소스를 정리합니다.

## 모델 구조 조건

현재 코드는 GLB 안에서 `upper`, `downer`라는 이름의 메시를 찾습니다. Blender에서 이름을 바꾸면 `opener-effect.js`의 `getObjectByName()` 이름도 함께 변경해야 합니다.
