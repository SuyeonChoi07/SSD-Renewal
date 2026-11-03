import { createModelExperience } from './assets/tws-scroll-reuse/model-experience.js';

function initializeBrandModel() {
  const container=document.querySelector('.brand-model-stage');
  const brand=document.querySelector('#brand');
  if(!container||!brand||!window.storyModel)return;
  try {
    const model=createModelExperience({
      container,
      sections:[brand,brand],
      getScrollPositions:()=>window.storyModel.brandAnchors,
      framing:{size:550},
      isActive:()=>brand.classList.contains('is-visible')
    });
    window.brandBreadModel=model;
    model.ready.then(()=>{ container.dataset.status='ready'; }).catch(error=>{
      container.dataset.status='error';model.destroy();
      console.error('Brand 빵 3D 모델 로딩 실패:',error);
    });
  } catch(error) {
    container.dataset.status='error';
    console.error('Brand 빵 3D 모델 초기화 실패:',error);
  }
}

if(window.storyModel)initializeBrandModel();
else document.addEventListener('DOMContentLoaded',initializeBrandModel,{once:true});
