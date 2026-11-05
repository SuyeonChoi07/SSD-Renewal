import { mountTableScene } from './table-scene-kit/table-scene.js';

const stage=document.querySelector('.table-model-stage');
if(stage){
  mountTableScene(stage).then(controller=>{
    if(!controller)return;
    const update=()=>controller.setProgress(window.tableSceneProgress??0);
    window.addEventListener('table-scene-update',update);
    update();
  });
}
