import { mountTableScene } from './table-scene-kit/table-scene.js';
import { tableSettings } from './table-scene-kit/settings.js';

const stage=document.querySelector('.table-model-stage');
if(stage){
  mountTableScene(stage,{...tableSettings,onProgress:progress=>{
    window.tableMotionProgress=progress;
    window.dispatchEvent(new Event('table-scene-motion'));
  }}).then(controller=>{
    if(!controller)return;
    const update=()=>controller.playTo(window.tableSceneTarget??0);
    window.addEventListener('table-scene-update',update);
    update();
  });
}
