import { createModelExperience } from './assets/tws-model-kit/model-experience.js';

function initializeIntroModel(){
const container=document.querySelector('.intro-model-stage');
const stage=document.querySelector('.design-stage');
const chapters=document.querySelectorAll('.scroll-chapter');
if(!container||!stage||!window.storyModel)return;
try {
  const model=createModelExperience({
    container,
    sections:[chapters[1],chapters[1],chapters[2]],
    getScrollPositions:()=>window.storyModel.anchors,
    // 이전 빵의 438×438 영역과 같은 초기 크기, 기존 초기 중심 좌표.
    framing:{size:438,centerX:1035,centerY:545},
    isActive:()=>Number(container.dataset.opacity)>0,
    onUpdate:({swapProgress})=>{
      const {x,y,scale}=window.storyModel.placement(swapProgress);
      container.style.transform=`translate(${x}px, ${y}px) scale(${scale})`;
    }
  });
  window.introBreadModel=model;
  model.ready.then(()=>{
    stage.dataset.modelReady='true';container.dataset.status='ready';
  }).catch(error=>{
    container.dataset.status='error';model.destroy();
    console.error('빵 3D 모델 로딩 실패:',error);
  });
} catch(error) {
  container.dataset.status='error';console.error('빵 3D 모델 초기화 실패:',error);
}
}
if(window.storyModel)initializeIntroModel();
else document.addEventListener('DOMContentLoaded',initializeIntroModel,{once:true});
