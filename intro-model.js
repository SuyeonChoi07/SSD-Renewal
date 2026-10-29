/* Sketchfab 모델은 기존 Intro 빵 컨테이너 안에서만 렌더링합니다.
 * 화면 내 위치/회전/손 위 도착/History 전환은 script.js가 기존과 동일하게 제어합니다. */
(() => {
  'use strict';
  function fittedCamera(camera, distance) {
    const factor=Math.max(.5,Math.min(2,Number(distance)||1.05));
    return {target:camera.target.slice(),position:camera.position.map((v,i)=>camera.target[i]+(v-camera.target[i])*factor)};
  }
  if(typeof module!=='undefined')module.exports={fittedCamera};
  if(typeof document==='undefined')return;
  const iframe=document.querySelector('.intro-bread-viewer');
  if(!iframe)return;
  const bread=iframe.closest('[data-node-id="738:634"]');
  const fallback=()=>{bread.dataset.modelState='fallback';};
  if(typeof Sketchfab==='undefined'){fallback();return;}
  bread.dataset.modelState='loading';
  const timeout=setTimeout(fallback,45000);
  const fail=()=>{clearTimeout(timeout);fallback();};
  const client=new Sketchfab(iframe);
  client.init(iframe.dataset.modelId,{
    autostart:1,autospin:0,camera:0,transparent:1,dnt:1,
    scrollwheel:0,preload:1,ui_controls:0,ui_infos:0,ui_hint:0,
    ui_stop:0,ui_annotations:0,ui_watermark:0,ui_watermark_link:0,
    success(api){
      api.addEventListener('viewerready',()=>{
        api.setUserInteraction(false);
        api.setCameraEasing('easeInOutCubic');
        // 모델 전체를 원본 이미지와 같은 정사각형 영역 안에 맞춥니다.
        api.setEnableCameraConstraints(false,{},()=>{
          api.focusOnVisibleGeometries(error=>{
            if(error){fail();return;}
            api.getCameraLookAt((error,camera)=>{
              if(error||!camera){fail();return;}
              const fit=fittedCamera(camera,iframe.dataset.cameraDistance);
              api.setCameraLookAt(fit.position,fit.target,0,error=>{
                if(error){fail();return;}
                api.setBackground({transparent:true},error=>{
                  if(error){fail();return;}
                  clearTimeout(timeout);
                  bread.dataset.modelState='ready';
                });
              });
            });
          });
        });
      });
      api.start();
    },
    error:fail
  });
})();
