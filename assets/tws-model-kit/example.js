import { createModelExperience } from './model-experience.js';

// 기존 HTML에 적용할 때는 이 선택자 네 개를 해당 페이지에 맞춰 바꿉니다.
const model = createModelExperience({
  container: '#model-stage',
  sections: ['#section-01', '#section-02', '#section-03']
});

model.ready.catch(error => {
  console.error('3D 모델 로딩 실패:', error);
  model.destroy();
});

// 단일 페이지 앱에서 해당 화면을 제거할 때 model.destroy()를 호출합니다.
// model.getState()로 현재 회전값(라디안), 구간 진행률, 표시 모델을 확인할 수 있습니다.
