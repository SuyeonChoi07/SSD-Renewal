import { mountTableScene } from './table-scene-kit/table-scene.js';

const stage=document.querySelector('.table-model-stage');
if(stage){
  mountTableScene(stage).then(controller=>{
    if(!controller)return;
    const update=()=>controller.playTo(window.tableSceneTarget??0);
    window.addEventListener('table-scene-update',update);
    update();
  });
}
