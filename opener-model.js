import { createOpenerEffect } from './assets/opener-effect/opener-effect.js';

async function initializeOpener() {
  const container=document.querySelector('.opener-effect');
  if(!container||!window.storyModel)return;
  try {
    const effect=await createOpenerEffect({
      container,
      modelUrl:new URL('./assets/opener-effect/assets/opener.glb',import.meta.url).href,
      wheel:false
    });
    window.openerEffect=effect;
    effect.setProgress(window.storyModel.openerProgress??0);
    container.dataset.status='ready';
  } catch(error) {
    container.dataset.status='error';
    console.error('Our Way 포장지 3D 모델 로딩 실패:',error);
  }
}

if(window.storyModel)initializeOpener();
else document.addEventListener('DOMContentLoaded',initializeOpener,{once:true});
