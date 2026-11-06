/* Particle Flow — 외부 의존성 없는 Canvas 효과. 일반 script 또는 ESM 어댑터로 사용. */
(function(global){
'use strict';
const defaults=Object.freeze({count:1500,width:800,peakWidth:1000,color:'#F8F0E5',pointerRadius:700,pointerForce:45,maxDpr:2});
function createParticleFlow(target,config={}){
  const host=typeof target==='string'?document.querySelector(target):target;
  if(!host||!host.appendChild)throw new Error('파티클을 넣을 컨테이너를 지정하세요.');
  const options={...defaults,...config};
  for(const key of ['count','width','peakWidth','pointerRadius','maxDpr'])if(!Number.isFinite(options[key])||options[key]<=0)throw new Error(key+'는 양수여야 합니다.');
  if(!Number.isInteger(options.count)||!Number.isFinite(options.pointerForce)||options.pointerForce<0)throw new Error('count는 정수, pointerForce는 0 이상이어야 합니다.');
  if(!/^#[0-9a-f]{6}$/i.test(options.color))throw new Error('color는 #RRGGBB 형식이어야 합니다.');
  const rgb=options.color.slice(1).match(/../g).map(v=>parseInt(v,16)).join(',');
  const canvas=document.createElement('canvas');canvas.className='particle-flow-canvas';canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});
  const oldPosition=host.style.position;
  const ownsPosition=getComputedStyle(host).position==='static';if(ownsPosition)host.style.position='relative';
  host.appendChild(canvas);
  const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();if(ownsPosition)host.style.position=oldPosition;throw new Error('Canvas 2D를 사용할 수 없습니다.');}
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');svg.style.position='absolute';
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');svg.appendChild(path);host.appendChild(svg);
  const settings={count:options.count},FLOW_WIDTH=options.width;
  let raf=null,destroyed=false,showPath=false;
const widthProfile={start:.25,peak:.45,end:.75};
const flowAxis={x:0,y:1,length:1,startY:0};
function getFlowWidth(progress){
  if(progress<=widthProfile.start||progress>=widthProfile.end)return FLOW_WIDTH;
  const t=progress<=widthProfile.peak
    ?(progress-widthProfile.start)/(widthProfile.peak-widthProfile.start)
    :(widthProfile.end-progress)/(widthProfile.end-widthProfile.peak);
  // 끝점의 기울기와 곡률이 0인 보간으로 폭이 자연스럽게 이어집니다.
  const blend=t*t*t*(t*(t*6-15)+10);
  return FLOW_WIDTH+(options.peakWidth-FLOW_WIDTH)*blend;
}
let width=0,height=0,length=0,points=[],particles=[],elapsed=0,last=0;
const spreadNormal={x:0,y:1};
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let paused=motionQuery.matches;
const pointer={x:0,y:0,active:false};
const random=(min,max)=>min+Math.random()*(max-min);
function sampleNormal(mean,sigma,min,max){
  let value;
  do {
    const u=1-Math.random(),v=Math.random();
    value=mean+Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)*sigma;
  } while(value<min||value>max);
  return value;
}
function sampleDuration(){
  // Box–Muller 변환. 범위 밖은 재추출하여 양 끝에 값이 몰리지 않게 합니다.
  return sampleNormal(10.5,.5,9,12);
}
function sampleLaneMotion(){
  // 회전 대칭인 정규 난수 쌍을 사용해 시간이 지나도 중심 밀도를 유지합니다.
  let a,b;
  do {
    a=sampleNormal(0,.16,-.5,.5);
    b=sampleNormal(0,.16,-.5,.5);
  } while(Math.hypot(a,b)>.5);
  return {a,b};
}
function getLaneOffset(particle,time){
  const angle=time*particle.frequency+particle.phase;
  return particle.outside
    ?particle.lane+Math.sin(angle)*particle.sway
    :particle.lane*Math.cos(angle)+particle.crossLane*Math.sin(angle);
}

// 1. 경로: 화면 비율로 정의한 곡선을 실제 픽셀 좌표로 만듭니다.
function rebuildPath(){
  width=Math.max(1,host.clientWidth);height=Math.max(1,host.clientHeight);
  const dpr=Math.min(devicePixelRatio||1,options.maxDpr);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  // 시작 (0%, 35%) → 끝 (85%, 100%).
  // 기본 구간 비율 25%, 20%, 30%, 25%에 첫 번째 극점의 위치 보정을 적용합니다.
  const endX=width*.85,endY=height*.65;
  const axisLength=Math.hypot(endX,endY);
  Object.assign(flowAxis,{x:endX/axisLength,y:endY/axisLength,length:axisLength,startY:height*.35});
  spreadNormal.x=-endY/axisLength;
  spreadNormal.y=endX/axisLength;
  const amplitude=height*.15; // 이전에 줄인 굴곡 폭 수준을 유지합니다.
  const p=(progress,offset)=>`${endX*progress-endY/axisLength*offset},${height*.35+endY*progress+endX/axisLength*offset}`;
  const knots=[{t:0,o:0},{t:.25,o:-amplitude},{t:.45,o:amplitude},{t:.75,o:-amplitude},{t:1,o:0}];
  // 화면 좌표의 이동량을 기준선 방향과 수직 방향으로 분해합니다.
  const shiftX=-width*.03,shiftY=height*.05;
  knots[1].t+=(shiftX*endX+shiftY*endY)/(axisLength*axisLength);
  knots[1].o+=shiftX*spreadNormal.x+shiftY*spreadNormal.y;
  Object.assign(widthProfile,{start:knots[1].t,peak:knots[2].t,end:knots[3].t});
  let d=`M ${p(0,0)}`;
  for(let i=1;i<knots.length;i++){
    const a=knots[i-1],b=knots[i],third=(b.t-a.t)/3;
    // 각 극점에서 수직 오프셋의 기울기를 0으로 만들어 접선을 연결합니다.
    d+=` C ${p(a.t+third,a.o)} ${p(b.t-third,b.o)} ${p(b.t,b.o)}`;
  }
  path.setAttribute('d',d);
  length=path.getTotalLength();
  // 등거리 샘플을 저장해 프레임마다 SVG 측정을 반복하지 않습니다.
  const samples=Math.max(500,Math.ceil(length/3));
  points=Array.from({length:samples+1},(_,i)=>{
    const point=path.getPointAtLength(length*i/samples);
    return {x:point.x,y:point.y};
  });
}
function sample(progress){
  const index=progress*(points.length-1),i=Math.min(Math.floor(index),points.length-2),t=index-i;
  const a=points[i],b=points[i+1];
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}

// 2. 입자: 난수는 생성할 때 한 번만 지정합니다.
function createParticles(){
  const outsideCount=Math.floor(settings.count*.15);
  particles=Array.from({length:settings.count},(_,i)=>{
    // 바깥 입자를 진행 구간 전체에 고르게 배치합니다 (개수는 정수 내림).
    const outsideIndex=Math.floor((i+1)*outsideCount/settings.count);
    const outside=outsideIndex>Math.floor(i*outsideCount/settings.count);
    const side=Math.random()<.5?-1:1;
    // 내부 입자는 두 정규분포 성분을 섞어 중심을 오가며 이동합니다.
    const motion=outside?null:sampleLaneMotion();
    const lane=outside?side*random(.5,.625):motion.a;
    // 흔들리는 동안에도 바깥 입자는 반폭의 100~125% 구간을 유지합니다.
    const sway=outside?random(.15,.8)*Math.min(Math.abs(lane)-.5,.625-Math.abs(lane),.025):0;
    return {
      progress:(i+Math.random())/settings.count,duration:sampleDuration(),size:outside?random(1.5,3):random(1.5,4.5),
      outside,lane,crossLane:outside?0:motion.b,sway,phase:random(0,Math.PI*2),
      // 바깥 입자는 은은한 점으로 표현해 좁은 두 띠가 밝은 선으로 이어지지 않게 합니다.
      frequency:outside?random(.6,1.2):random(.2,.45),alpha:outside?random(.08,.24):random(.35,.95),pushX:0,pushY:0
    };
  });
}


// 3. 움직임: 진행 → 경로 조회 → 기준선에 수직인 오프셋 → 마우스 반응 → 그리기.
function render(timestamp){
  if(destroyed)return;
  raf=null;
  const dt=last?Math.min((timestamp-last)/1000,.05):0;last=timestamp;
  const step=paused?0:dt;if(!paused)elapsed+=step;
  ctx.clearRect(0,0,width,height);
  if(showPath){
    ctx.save();ctx.strokeStyle='#83c7b75c';ctx.lineWidth=1;ctx.setLineDash([5,8]);
    ctx.stroke(new Path2D(path.getAttribute('d')));ctx.restore();
  }
  for(const particle of particles){
    // 입자마다 배정된 통과 시간에 따라 경로 길이 기준 등속 이동합니다.
    const nextProgress=particle.progress+step/particle.duration;
    particle.progress=nextProgress%1;
    const center=sample(particle.progress);
    const axisProgress=(center.x*flowAxis.x+(center.y-flowAxis.startY)*flowAxis.y)/flowAxis.length;
    const localWidth=getFlowWidth(axisProgress);
    const offset=localWidth*getLaneOffset(particle,elapsed);
    // 곡선의 법선은 굴곡마다 회전해 넓은 오프셋 경로가 접힐 수 있습니다.
    // 고정된 기준선 법선을 쓰면 폭과 흔들림이 진행 방향 좌표를 바꾸지 않습니다.
    const x=center.x+spreadNormal.x*offset,y=center.y+spreadNormal.y*offset;
    let targetX=0,targetY=0;
    if(pointer.active){
      const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy),radius=options.pointerRadius;
      if(d<radius){const force=(1-d/radius)**2*options.pointerForce;
        targetX=(d>.01?dx/d:Math.cos(particle.phase))*force;
        targetY=(d>.01?dy/d:Math.sin(particle.phase))*force;}
    }
    // 지수 보간: 마우스가 멀어지면 기준 위치로 부드럽게 복귀합니다.
    const ease=1-Math.exp(-8*step);
    particle.pushX+=(targetX-particle.pushX)*ease;particle.pushY+=(targetY-particle.pushY)*ease;
    const outsideFade=particle.outside?1-.65*Math.max(0,Math.min(1,(Math.abs(offset)/localWidth-.5)/.125)):1;
    const fade=Math.min(1,particle.progress/.04,(1-particle.progress)/.04)*outsideFade;
    const drawX=x+particle.pushX,drawY=y+particle.pushY;
    ctx.beginPath();ctx.fillStyle=`rgba(${rgb},${particle.alpha*fade})`;
    ctx.shadowColor=options.color;ctx.shadowBlur=particle.outside?1:7;
    ctx.arc(drawX,drawY,particle.size/2,0,Math.PI*2);ctx.fill();
  }
  if(!destroyed&&!paused&&!document.hidden)raf=requestAnimationFrame(render);
}

  const removers=[];
  function listen(object,name,handler){object.addEventListener(name,handler);removers.push(()=>object.removeEventListener(name,handler));}
  function schedule(){if(!destroyed&&raf===null&&!document.hidden)raf=requestAnimationFrame(render);}
  function setPaused(value){paused=Boolean(value);last=0;if(raf!==null){cancelAnimationFrame(raf);raf=null;}schedule();}
  function move(event){
    const rect=canvas.getBoundingClientRect();
    pointer.x=(event.clientX-rect.left)*width/(rect.width||1);pointer.y=(event.clientY-rect.top)*height/(rect.height||1);
    pointer.active=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
  }
  listen(window,'pointermove',move);listen(window,'pointerdown',move);
  listen(window,'pointerup',event=>{if(event.pointerType!=='mouse')pointer.active=false;});
  listen(window,'pointercancel',()=>pointer.active=false);listen(window,'blur',()=>pointer.active=false);
  listen(window,'pointerout',event=>{if(!event.relatedTarget)pointer.active=false;});
  listen(window,'scroll',()=>pointer.active=false);
  listen(document,'visibilitychange',()=>{last=0;pointer.active=false;if(document.hidden&&raf!==null){cancelAnimationFrame(raf);raf=null;}else schedule();});
  listen(motionQuery,'change',event=>setPaused(event.matches));
  function resize(){if(destroyed)return;pointer.active=false;rebuildPath();last=0;schedule();}
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
  if(observer)observer.observe(host);
  listen(window,'resize',resize);
  rebuildPath();createParticles();schedule();
  return {
    pause(){setPaused(true)},resume(){setPaused(false)},
    reset(){elapsed=0;last=0;pointer.active=false;createParticles();schedule();},
    setShowPath(value){showPath=Boolean(value);schedule();},
    destroy(){if(destroyed)return;destroyed=true;if(raf!==null)cancelAnimationFrame(raf);if(observer)observer.disconnect();removers.forEach(remove=>remove());canvas.remove();svg.remove();if(ownsPosition)host.style.position=oldPosition;},
    get paused(){return paused;},get config(){return {...options};}
  };
}
global.ParticleFlow=Object.freeze({create:createParticleFlow,defaults});
})(window);
