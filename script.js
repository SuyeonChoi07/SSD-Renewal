/* 내부 스크롤 완료 → 마지막 화면 1,500px 고정 → 다음 화면 전환. Landing은 고정 제외. */
(() => {
  'use strict';
  const TRANSITION_SCROLL_PX = 250;
  const HOLD_SCROLL_PX = 1500;
  // Brand: 제목 5248px → 화면 180px. 사진 3635px 중 보이는 폭 1806px를 제외한 거리.
  const BRAND_HALL_PIN = 5248 - 180;
  const BRAND_HALL_SCROLL = 3635 - 1806;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  // CSS ease-in-out와 동일한 cubic-bezier(.42, 0, .58, 1).
  const ease = value => {
    const x=clamp(value);
    if(x===0||x===.5||x===1)return x;
    let low=0,high=1;
    for(let i=0;i<24;i++){
      const t=(low+high)/2,u=1-t;
      const bx=3*u*u*t*.42+3*u*t*t*.58+t*t*t;
      if(bx<x)low=t;else high=t;
    }
    const t=(low+high)/2;
    return 3*(1-t)*t*t+t*t*t;
  };
  function timeline(heights) {
    let start = 0;
    return heights.map((height, index) => {
      const hold = index === 0 || index === 6 || index === 11 || index === 15 ? 0 : index >= 3 && index <= 5 ? 800 : HOLD_SCROLL_PX;
      const travel = Math.max(0, height - 1020);
      const entryHold = index === 11 ? 0 : index === 17 ? 1680 : 1000;
      const motion = index === 2 ? 2800 : index === 3 ? 900 : index === 4 ? 4600 : index === 5 ? 8200 : index === 6 || index === 7 ? 1000 : index === 8 ? 1700 : index === 17 ? BRAND_HALL_SCROLL : 0;
      const transition = index === heights.length - 1 || index === 6 ? 0 : index === 9 ? 600 : index === 14 ? 700 : index === 15 ? 2050 : index === 13 ? 1400 : index === 17 ? 1020 : TRANSITION_SCROLL_PX;
      const exitMotion = index === 8 ? 3450 : 0;
      const segment = { start, entryHold, hold, travel, motion, exitMotion, transition, length: entryHold + hold + travel + motion + exitMotion + transition };
      start += segment.length;
      return segment;
    });
  }
  function stateAt(scrollPx, heights) {
    const segments = timeline(heights);
    let index = segments.findIndex(segment => scrollPx < segment.start + segment.length);
    if (index < 0) index = segments.length - 1;
    const segment = segments[index];
    // 진입 고정 구간에는 내부 스크롤과 스크롤 기반 효과의 시간도 함께 멈춥니다.
    const local = clamp(scrollPx - segment.start - segment.entryHold, 0, segment.length - segment.entryHold);
    const offset = index===17?brandPose(local,segment.travel).offset:clamp(local, 0, segment.travel);
    const transition = segment.transition ? clamp((local - segment.hold - segment.travel - segment.motion - segment.exitMotion) / segment.transition) : 0;
    return { index, local, transition, offset };
  }
  function transitionWeights(index, progress) {
    if(index===17)return {outgoing:1,incoming:1,black:0};
    if (index === 15) {
      const incoming=wrapperExitPose(progress).fade;
      return {outgoing:1-incoming,incoming,black:0};
    }
    if (index === 13) {
      // Table_tilt → 검정 → Our Way_start. 역방향 스크롤도 동일합니다.
      const elapsed=1400*clamp(progress);
      const outgoing = 1 - ease(clamp(elapsed / 450));
      const incoming = ease(clamp((elapsed - 950) / 450));
      const black = elapsed < 450 ? 1 - outgoing : elapsed > 950 ? 1 - incoming : 1;
      return { outgoing, incoming, black };
    }
    // 이전 화면은 완전 불투명하게 받치고 다음 화면만 올려 합성 알파를 1로 유지합니다.
    return { outgoing: 1, incoming: ease(progress), black: 0 };
  }
  function introPose(offset, travel) {
    const progress = clamp(travel ? offset / travel : 0);
    const settle = ease(clamp((progress - .76) / .24));
    return { progress, breadX: 1035, breadY: 326 + 24 * settle, breadRotation: 360 * ease(progress) };
  }
  function brandPose(local,travel=6129) {
    const progress=clamp(local,0,travel+BRAND_HALL_SCROLL);
    const horizontal=clamp((progress-BRAND_HALL_PIN)/BRAND_HALL_SCROLL);
    const offset=progress<=BRAND_HALL_PIN?progress:progress<=BRAND_HALL_PIN+BRAND_HALL_SCROLL?BRAND_HALL_PIN:progress-BRAND_HALL_SCROLL;
    // 사진에 접근하면 빵 중심을 사진 세로 중심으로 내리고, 가로 이동 이후에는 함께 스크롤.
    const breadDrop=110.5*ease(clamp((progress-(BRAND_HALL_PIN-400))/400));
    const breadOffset=Math.min(offset,BRAND_HALL_PIN)+breadDrop;
    return {offset:Math.min(travel,offset),galleryX:horizontal===0?0:-BRAND_HALL_SCROLL*ease(horizontal),
      breadOffset,
      breadRotation:360*ease(progress/(travel+BRAND_HALL_SCROLL))};
  }
  function contactScrollPose(progress) {
    const y=1020*ease(clamp(progress));
    return {brandY:-y,contactY:1020-y};
  }
  function brandCharacterOpacity(entryScroll,local,index,count) {
    const order=count>1?index/(count-1):0;
    const incoming=ease(clamp((entryScroll-500-order*480)/200));
    const outgoing=ease(clamp((local-order*100)/80));
    return incoming*(1-outgoing);
  }
  function brandCellOpacity(centerVh) {
    if(centerVh<=.3||centerVh>=.7)return .5;
    if(centerVh>=.4&&centerVh<=.6)return 1;
    return .5+.5*ease(centerVh<.4?(centerVh-.3)/.1:(.7-centerVh)/.1);
  }
  function brandGalleryReveal(topVh) {
    if(topVh>=.85)return 0;
    if(topVh<=.55)return 1;
    return ease((.85-topVh)/.3);
  }
  function introLinePose(progress, enter, exit, line, initiallyVisible = false) {
    const stagger = line * .025;
    const incoming = initiallyVisible ? 1 : ease(clamp((progress - enter - stagger) / .12));
    const outgoing = exit === null ? 0 : ease(clamp((progress - exit - stagger) / .12));
    return { opacity: incoming * (1 - outgoing), y: (1 - incoming) * 40 - outgoing * 40 };
  }
  function historyPose(local, arrival = 1) {
    const morph = ease(clamp(arrival));
    return { outline: ease(clamp((local - 800) / 1200)), text: ease(clamp((local - 2000) / 800)),
      breadX: 1035 - 3.5 * morph, breadY: 350 - 26 * morph,
      breadWidth: 438 - 33 * morph, wrappedHeight: (438 - 33 * morph) * 373 / 405 };
  }
  function historyExitPose(progress) {
    const t=ease(clamp(progress));
    const mix=(a,b)=>a+(b-a)*t;
    return { t, outlineX:mix(1029,1032), outlineY:mix(258,144), outlineWidth:mix(500,610), outlineHeight:mix(500,732),
      titleX:mix(1032,68), titleY:mix(377,142), titleSize:mix(180,36), titleAlpha:mix(1,.59),
      breadY:mix(324,150), outgoingRotation:-180*t, incomingRotation:0,
      photoWidth:mix(405,600), photoHeight:mix(373,720), photoX:97*(1-t), photoY:174*(1-t) };
  }
  function historyContentPose(local, transition = 0, order = 0) {
    const image = ease(clamp(local / 400));
    const photos = ease(clamp((local - 400 - order * 20) / 300));
    const captionIn = ease(clamp(local / 350)), captionOut = ease(clamp(transition));
    return { imageOpacity:image, imageBlur:24*(1-image), photoOpacity:photos, photoX:220*(1-photos),
      captionOpacity:captionIn*(1-captionOut), captionY:32*(1-captionIn)+32*captionOut };
  }
  function historyCarouselFocus(index, local) {
    if(index<4)return 0;
    if(index>5)return 8;
    const base=index===4?0:3, count=index===4?3:5;
    const step=Math.min(count,Math.floor(Math.max(0,local)/1800));
    return base+Math.min(count,step+clamp((local-step*1800)/1000));
  }
  function historyCarouselGeometry(focus, index) {
    const from=Math.min(7,Math.floor(clamp(focus,0,8))), p=clamp(focus-from);
    const t=ease(p); // 공통 ease-in-out 가속·감속
    function at(active) {
      const width=index===active?600:250, height=index===active?720:300;
      const start=732-active*280;
      const x=start+index*280+(index>active?350:0);
      return {x,y:(720-height)/2,width,height,opacity:index===active?1:.6};
    }
    const a=at(from),b=at(from+1);
    return Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*t]));
  }
  function shouldExpandHistoryPhoto(index, transition) {
    return index > 5 || (index === 5 && transition > 0);
  }
  function historyZoomPose(index,local,transition=0) {
    const keys=[{x:732,y:150,width:600,height:720},{x:651,y:-10,width:784,height:1030},{x:391,y:0,width:1582,height:1020},{x:0,y:0,width:2064,height:1020}];
    const p=index<5?0:index===5?clamp(transition):index===6?1+clamp(local/1000):index===7?2+clamp(local/1000):3;
    const a=Math.min(2,Math.floor(p)),t=ease(p-a),from=keys[a],to=keys[a+1];
    return {...Object.fromEntries(Object.keys(from).map(k=>[k,from[k]+(to[k]-from[k])*t])),progress:p};
  }
  function historyImageCrops(progress) {
    const lerp=(a,b,t)=>a+(b-a)*t;
    const crop=(a,b,t)=>Object.fromEntries(Object.keys(a).map(k=>[k,lerp(a[k],b[k],t)]));
    // 목록 사진 350×241은 bridge 사진 350×292에서 상단 52px가 잘린 버전입니다.
    const aligned={width:174.27,height:100*292/241,left:-39.86,top:-100*52/241};
    const first={width:157.47,height:100,left:-31.38,top:.01};
    const second={width:159.79,height:206.75,left:-31.7,top:-7.52};
    const front=progress<=1?crop(aligned,first,ease(clamp(progress))):crop(first,second,ease(clamp(progress-1)));
    const history={width:front.width,height:front.height*241/292,left:front.left,top:front.top+front.height*52/292};
    // 두 원본의 흰 간판 글씨 bbox 중심·크기를 기준으로 고해상도 면을 정렬합니다.
    function alignHigh(low) {
      const width=low.width*(99/350)/(1202/4096),height=low.height*(23/292)/(304/3417);
      return {width,height,left:low.left+low.width*(181.5/350)-width*(2140/4096),top:low.top+low.height*(71.5/292)-height*(847/3417)};
    }
    const back=progress<=2?alignHigh(front):crop(alignHigh(second),{width:159.93,height:270,left:-17.2,top:-13.63},ease(clamp(progress-2)));
    return {front,history,back};
  }
  function daejeonPose(local, line=0) {
    const panel=ease(clamp(local/500));
    const text=ease(clamp((local-800-line*70)/250));
    return {panelOpacity:panel,panelX:702*(panel-1),textOpacity:text,textY:32*(text-1),dividerOpacity:ease(clamp((local-1300)/200))};
  }
  function daejeonExitPose(elapsed,line=0,count=9) {
    const text=ease(clamp((elapsed-(count-1-line)*60)/250));
    const panel=ease(clamp((elapsed-750)/500));
    return {textOpacity:1-text,textY:-32*text,panelOpacity:1-panel,panelX:-702*panel,
      align:ease(clamp((elapsed-1250)/800)),fade:ease(clamp((elapsed-2050)/1400))};
  }
  function daejeonAlignedCrop(progress) {
    const width=159.93,height=270;
    const centerX=574+947*196.5/415,centerY=383+314*1.2134*62.5/167;
    const left=(centerX-width/100*2064*2140/4096)/2064*100;
    const top=(centerY-height/100*1020*847/3417)/1020*100;
    return {width,height,left:-17.2+(left+17.2)*clamp(progress),top:-13.63+(top+13.63)*clamp(progress)};
  }
  function daejeonAlignedLogoRect() {
    const crop=daejeonAlignedCrop(1);
    const sx=crop.width/100*2064/4096,sy=crop.height/100*1020/3417;
    // 원본 흰 획 마스크와 로고를 균일 배율로 대조한 최적 정렬값.
    const scale=2.85*sx;
    return {x:crop.left/100*2064+1530*sx,y:crop.top/100*1020+634*sy,width:415*scale,height:167*scale/1.2134};
  }
  function wrapperExitPose(progress) {
    const elapsed=2050*clamp(progress);
    return {elapsed,fade:ease(clamp((elapsed-1800)/250))};
  }
  function wrapperTearPose(index,transition) {
    const distance=index<14?0:index===14?700*clamp(transition):index===15?700+wrapperExitPose(transition).elapsed:2000;
    const step=index>=16||distance>=2000?21:distance<=0?0:Math.min(20,Math.floor((distance+1e-7)/100)+1);
    return {step,frame:step<21?step:-1,opacities:Array.from({length:21},(_,i)=>step<21&&i===step?1:0)};
  }
  function wrapperCopyVisible(index,progress) {
    return index>=14;
  }
  function headerPose(index, progress) {
    const t = ease(clamp(progress));
    const mix = (a,b) => a + (b-a)*t;
    const group = i => i >= 18 ? 4 : i >= 17 ? 3 : i >= 9 ? 2 : i >= 2 ? 1 : 0;
    const light = index===15?wrapperExitPose(progress).fade:mix(index === 16 ? 1 : 0, index + 1 === 16 ? 1 : 0);
    return { width: mix(index === 0 ? 365.299 : 124, 124), height: mix(index === 0 ? 147 : 50, 50), light,
      active: Array.from({length:5},(_,i) => mix(group(index)===i?1:0, group(index+1)===i?1:0)) };
  }
  if (typeof module !== 'undefined') module.exports = { ease, HOLD_SCROLL_PX, TRANSITION_SCROLL_PX, timeline, stateAt, transitionWeights, introPose, introLinePose, headerPose, historyPose, historyExitPose, historyContentPose, historyCarouselFocus, historyCarouselGeometry, historyZoomPose, shouldExpandHistoryPhoto, historyImageCrops, daejeonPose, daejeonExitPose, daejeonAlignedCrop, daejeonAlignedLogoRect, wrapperTearPose, wrapperCopyVisible, brandPose, BRAND_HALL_PIN, BRAND_HALL_SCROLL };
  if (typeof module !== 'undefined') module.exports.contactScrollPose=contactScrollPose;
  if (typeof module !== 'undefined') module.exports.brandCharacterOpacity=brandCharacterOpacity;
  if (typeof module !== 'undefined') module.exports.brandCellOpacity=brandCellOpacity;
  if (typeof module !== 'undefined') module.exports.brandGalleryReveal=brandGalleryReveal;
  if (typeof document === 'undefined') return;
  const scenes = Array.from(document.querySelectorAll('.scene'));
  const heights = scenes.map(scene => Number(scene.dataset.frameHeight));
  const segments = timeline(heights);
  document.querySelectorAll('.scroll-chapter').forEach((chapter, index) => { chapter.style.height = segments[index].length + 'px'; });
  const stage = document.querySelector('.design-stage');
  // 원본 그라데이션 두 장을 스크롤되는 Contact 본문 밖의 고정 무대로 이동.
  const contactGradients=Array.from(scenes[18].querySelectorAll('.f19-layer-003, .f19-layer-004'));
  contactGradients.forEach(layer=>stage.append(layer));
  const veil = document.querySelector('.transition-blackout');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const intro = scenes[1];
  const bread = intro.querySelector('[data-node-id="738:634"]');
  const introCopy = [
    { element: intro.querySelector('[data-node-id="738:631"]'), enter: 0, exit: .20, initial: true },
    { element: intro.querySelector('[data-node-id="740:688"]'), enter: .32, exit: .59 },
    { element: intro.querySelector('[data-node-id="740:689"]'), enter: .71, exit: null }
  ];
  const introYear = intro.querySelector('[data-node-id="738:635"]');
  function renderIntro(offset) {
    const pose = introPose(offset, segments[1].travel);
    intro.style.setProperty('--intro-offset', offset + 'px');
    bread.style.setProperty('--bread-rotation', (reduced.matches ? 0 : pose.breadRotation) + 'deg');
    bread.style.setProperty('--bread-shift-y', (pose.breadY - 326) + 'px');
    introCopy.forEach(group => {
      group.element.querySelectorAll('p').forEach((line, index) => {
        const state = introLinePose(pose.progress, group.enter, group.exit, index, group.initial);
        line.style.opacity = state.opacity;
        line.style.setProperty('--line-y', (reduced.matches ? 0 : state.y) + 'px');
      });
      group.element.setAttribute('aria-hidden', String(pose.progress < group.enter || (group.exit !== null && pose.progress > group.exit + .22)));
    });
    const year = introLinePose(pose.progress, 0, .20, 0, true);
    introYear.style.opacity = year.opacity;
    introYear.style.setProperty('--line-y', (reduced.matches ? 0 : year.y) + 'px');
  }
  const historyScene = scenes[2];
  const historyBread = historyScene.querySelector('[data-node-id="749:88"]');
  const historyTitle = historyScene.querySelector('[data-node-id="749:87"]');
  const historyOutline = historyScene.querySelector('[data-node-id="749:89"]');
  function renderHistory(state) {
    const arrival = state.index < 1 ? 0 : state.index === 1 ? state.transition : 1;
    const local = state.index < 2 ? 0 : state.index === 2 ? state.local : 2800;
    const pose = historyPose(local, arrival);
    historyBread.style.setProperty('--history-bread-x', pose.breadX + 'px');
    historyBread.style.setProperty('--history-bread-y', pose.breadY + 'px');
    historyBread.style.setProperty('--history-bread-width', pose.breadWidth + 'px');
    historyBread.style.setProperty('--history-bread-height', pose.wrappedHeight + 'px');
    historyOutline.style.setProperty('--outline-length', pose.outline * 100 + '%');
    historyTitle.style.setProperty('--title-shift', (reduced.matches ? 0 : (1 - pose.text) * 2064) + 'px');
    historyTitle.style.opacity = pose.text;
    historyTitle.classList.toggle('is-glowing', state.index === 2 && local >= 2800);
    const exit = historyExitPose(state.index < 2 ? 0 : state.index === 2 ? state.transition : 1);
    Object.entries(exit).forEach(([key,value]) => {
      const unit=key.includes('Rotation')?'deg':['t','titleAlpha'].includes(key)?'':'px';
      stage.style.setProperty('--history-exit-'+key,value+unit);
    });
    const outgoing = state.index === 1 ? pose : historyPose(0, 0);
    bread.style.setProperty('--bread-arrival-x', (outgoing.breadX - 1035) + 'px');
    bread.style.setProperty('--bread-arrival-y', (outgoing.breadY - 350) + 'px');
    bread.style.setProperty('--intro-bread-size', outgoing.breadWidth + 'px');
  }
  // 세 History_content 프레임에서 하나의 원본 갤러리·문구·점선을 계속 사용합니다.
  const gallery=scenes[3].querySelector('.f04-layer-005');
  const carouselPhotos=Array.from(gallery.children);
  carouselPhotos.forEach(photo=>photo.classList.add('history-carousel-photo'));
  const carouselCaption=scenes[3].querySelector('.f04-layer-048');
  function renderHistoryContents(state) {
    const local=state.index<3?0:state.index===3?state.local:900;
    const transition=state.index===5?state.transition:state.index>5?1:0;
    const entrance=historyContentPose(local,transition);
    const focus=historyCarouselFocus(state.index,state.local);
    carouselCaption.style.setProperty('--caption-opacity',entrance.captionOpacity);
    carouselCaption.style.setProperty('--caption-y',(reduced.matches?0:entrance.captionY)+'px');
    carouselPhotos.forEach((photo,index)=>{
      const geometry=historyCarouselGeometry(focus,index);
      const entry=index===0?entrance:historyContentPose(local,transition,index-1);
      const opacity=index===0?entrance.imageOpacity:entry.photoOpacity;
      const shift=index===0?0:entry.photoX;
      photo.style.setProperty('--carousel-x',(geometry.x+(reduced.matches?0:shift))+'px');
      photo.style.setProperty('--carousel-y',geometry.y+'px');
      photo.style.setProperty('--carousel-width',geometry.width+'px');
      photo.style.setProperty('--carousel-height',geometry.height+'px');
      photo.style.setProperty('--carousel-opacity',geometry.opacity*opacity);
      photo.style.setProperty('--carousel-blur',(index===0?entrance.imageBlur:0)+'px');
    });
  }
  const bridgeStack=document.querySelector('.bridge-photo-stack');
  const bridgeFront=bridgeStack.querySelector('.f07-layer-005');
  const lastHistoryImage=carouselPhotos[8];
  const historyCommon=[scenes[3].querySelector('.f04-layer-047'),scenes[3].querySelector('.f04-layer-048'),scenes[3].querySelector('.f04-layer-049')];
  function renderHistoryZoom(state) {
    const zoom=historyZoomPose(state.index,state.local,state.transition);
    const stackOpacity=state.index===5?ease(state.transition):state.index===6?1:state.index===7?1:0;
    bridgeStack.style.opacity=stackOpacity;
    bridgeStack.style.visibility=stackOpacity>0?'visible':'hidden';
    bridgeFront.style.opacity=1-ease(clamp(zoom.progress-1));
    Object.entries(zoom).forEach(([key,value])=>stage.style.setProperty('--history-zoom-'+key,value+(key==='progress'?'':'px')));
    const crops=historyImageCrops(zoom.progress);
    Object.entries(crops).forEach(([layer,crop])=>Object.entries(crop).forEach(([key,value])=>stage.style.setProperty('--aligned-'+layer+'-'+key,value+'%')));
    if(shouldExpandHistoryPhoto(state.index,state.transition)) {
      lastHistoryImage.style.setProperty('--carousel-x',zoom.x+'px');
      lastHistoryImage.style.setProperty('--carousel-y',(zoom.y-150)+'px');
      lastHistoryImage.style.setProperty('--carousel-width',zoom.width+'px');
      lastHistoryImage.style.setProperty('--carousel-height',zoom.height+'px');
      const fade=1-ease(clamp(zoom.progress));
      carouselPhotos.slice(0,8).forEach(photo=>photo.style.setProperty('--carousel-opacity',.6*fade));
      historyCommon.forEach(element=>element.style.setProperty('--zoom-common-opacity',fade));
    } else historyCommon.forEach(element=>element.style.setProperty('--zoom-common-opacity',1));
  }
  const daejeon=scenes[8],daejeonPanel=daejeon.querySelector('.f09-layer-008');
  const daejeonLines=Array.from(daejeon.querySelectorAll('.f09-layer-012 .daejeon-line, .f09-layer-009 .daejeon-line'));
  // 본문 위쪽 줄부터 읽고 마지막에 아래쪽 결론 두 줄을 표시합니다.
  daejeonLines.sort((a,b)=>Number(a.closest('.f09-layer-009')!==null)-Number(b.closest('.f09-layer-009')!==null));
  const daejeonDivider=daejeon.querySelector('.f09-layer-017');
  const daejeonLogo=document.querySelector('.daejeon-logo-overlay');
  function renderDaejeon(state) {
    const local=state.index<8?0:state.index===8?state.local:1700;
    const pose=daejeonPose(local);
    daejeonPanel.style.setProperty('--panel-opacity',pose.panelOpacity);
    daejeonPanel.style.setProperty('--panel-x',(reduced.matches?0:pose.panelX)+'px');
    const elapsed=state.index<8?0:state.index===8?Math.max(0,state.local-segments[8].motion-segments[8].hold):segments[8].exitMotion;
    const exit=daejeonExitPose(elapsed);
    daejeonPanel.style.setProperty('--panel-opacity',pose.panelOpacity*exit.panelOpacity);
    daejeonPanel.style.setProperty('--panel-x',((reduced.matches?0:pose.panelX)+(reduced.matches?0:exit.panelX))+'px');
    daejeonDivider.style.opacity=pose.dividerOpacity*(1-ease(clamp(elapsed/250)));
    daejeonLines.forEach((line,index)=>{
      const p=daejeonPose(local,index);
      const out=daejeonExitPose(elapsed,index,daejeonLines.length);
      p.textOpacity*=out.textOpacity; p.textY+=out.textY;
      line.style.setProperty('--daejeon-line-opacity',p.textOpacity);
      line.style.setProperty('--daejeon-line-y',(reduced.matches?0:p.textY)+'px');
    });
  }
  function renderDaejeonHandoff(state) {
    const elapsed=state.index<8?0:state.index===8?Math.max(0,state.local-segments[8].motion-segments[8].hold):segments[8].exitMotion;
    const pose=daejeonExitPose(elapsed);
    if(state.index===8){
      Object.entries(daejeonAlignedCrop(pose.align)).forEach(([key,value])=>stage.style.setProperty('--aligned-back-'+key,value+'%'));
    }
    const blend=ease(clamp((pose.fade-.25)/.5));
    daejeon.style.setProperty('--daejeon-bg-opacity',1-blend);
    const next=state.index===9?ease(state.transition):0;
    daejeonLogo.style.opacity=state.index===8?blend:state.index===9?1-next:0;
    daejeonLogo.style.visibility=state.index===8&&pose.fade>0||state.index===9?'visible':'hidden';
    const rect=daejeonAlignedLogoRect(),target={x:908,y:494,width:279,height:92};
    Object.keys(rect).forEach(key=>daejeonLogo.style.setProperty('--handoff-logo-'+key,(rect[key]+(target[key]-rect[key])*next)+'px'));
  }
  const tearSequence=document.querySelector('.tear-sequence');
  const tearFrames=Array.from(tearSequence.querySelectorAll('.tear-frame'));
  const wrapperCopy=document.querySelector('#our-way-start .f15-layer-002');
  function renderWrapperTear(state) {
    const pose=wrapperTearPose(state.index,state.transition);
    const visible=state.index===13?transitionWeights(13,state.transition).incoming:state.index===14||state.index===15?1:0;
    tearSequence.style.opacity=visible;
    tearSequence.style.visibility=visible>0?'visible':'hidden';
    wrapperCopy.style.visibility=wrapperCopyVisible(state.index,state.transition)?'visible':'hidden';
    tearFrames.forEach((frame,index)=>{ frame.style.opacity=1; frame.hidden=pose.opacities[index]===0; });
  }
  const header = document.querySelector('.persistent-header');
  const brand=scenes[17];
  const brandGallery=brand.querySelector('.f18-layer-124');
  const brandCells=Array.from(brand.querySelector('.f18-layer-013').children);
  const brandCopy=brand.querySelector('.f18-layer-006');
  const brandTextGroups=[brand.querySelector('.f18-layer-002'),brandCopy].map(container=>{
    const paragraphs=Array.from(container.querySelectorAll('p:not(.f18-layer-009)'));
    container.setAttribute('role','group');
    container.setAttribute('aria-label',paragraphs.map(p=>p.innerText).join('\n'));
    const characters=[];
    paragraphs.forEach(paragraph=>{
      paragraph.setAttribute('aria-hidden','true');
      Array.from(paragraph.childNodes).filter(node=>node.nodeType===3).forEach(node=>{
        const fragment=document.createDocumentFragment();
        Array.from(node.textContent.trim().replace(/\s+/g,' ')).forEach(character=>{
          const span=document.createElement('span');
          span.className='brand-copy-character';span.textContent=character;
          characters.push(span);fragment.append(span);
        });
        node.replaceWith(fragment);
      });
    });
    return characters;
  });
  function renderBrand(state) {
    const local=state.index<17?0:state.index===17?state.local:segments[17].travel+BRAND_HALL_SCROLL;
    const pose=brandPose(local,segments[17].travel);
    brand.style.setProperty('--brand-bread-offset',pose.breadOffset+'px');
    brand.style.setProperty('--brand-bread-rotation',(reduced.matches?0:pose.breadRotation)+'deg');
    brand.style.setProperty('--brand-gallery-x',pose.galleryX+'px');
    // 화면 시작 고정 구간의 실제 스크롤로 등장, 세로 스크롤 시작 후 글자별 퇴장.
    const entryScroll=state.index<17?0:state.index===17?clamp(window.scrollY-segments[17].start,0,segments[17].entryHold):segments[17].entryHold;
    brandTextGroups.forEach(characters=>characters.forEach((span,index)=>{
      span.style.opacity=reduced.matches?1:brandCharacterOpacity(entryScroll,local,index,characters.length);
    }));
    if(brand.classList.contains('is-visible')){
      const reveal=reduced.matches?1:brandGalleryReveal(brandGallery.getBoundingClientRect().top/innerHeight);
      // 레터박스와 화면 배율을 포함한 실제 viewport 기준의 cell 중심선.
      const opacities=brandCells.map(cell=>{
        const rect=cell.getBoundingClientRect();
        return brandCellOpacity((rect.top+rect.height/2)/innerHeight);
      });
      brandCells.forEach((cell,index)=>cell.style.setProperty('--brand-cell-opacity',opacities[index]));
      brandGallery.style.setProperty('--brand-gallery-reveal-x',(-100*(1-reveal))+'%');
    }
  }
  const headerLinks = Array.from(header.querySelectorAll('[data-name="nav"] > a'));
  function renderHeader(state) {
    const pose = headerPose(state.index, state.transition);
    header.style.setProperty('--logo-width', pose.width + 'px');
    header.style.setProperty('--logo-height', pose.height + 'px');
    header.style.setProperty('--header-light', pose.light);
    header.style.setProperty('--header-rgb', [248,240,229].map(v => v+(19-v)*pose.light).join(', '));
    headerLinks.forEach((link,index) => {
      link.style.setProperty('--active-weight', pose.active[index]);
      if(pose.active[index]>=.5)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
    });
  }
  let scheduled = false;
  function render() {
    scheduled = false;
    const state = stateAt(window.scrollY, heights);
    const weights = transitionWeights(state.index, state.transition);
    veil.style.opacity = weights.black;
    renderHeader(state);
    const contactScroll=contactScrollPose(state.index===17?state.transition:state.index>17?1:0);
    contactGradients.forEach(layer=>{
      layer.style.visibility=state.index===18||state.index===17&&state.transition>0?'visible':'hidden';
    });
    scenes.forEach((scene, index) => {
      let opacity = index === state.index ? weights.outgoing : index === state.index + 1 ? weights.incoming : 0;
      if(state.index>=3 && state.index<=5) {
        if(index===3)opacity=state.index===5?weights.outgoing:1;
        if(index===4||index===5)opacity=0;
      }
      if(state.index===14){
        if(index===state.index)opacity=1;
        if(index===state.index+1)opacity=0;
      }
      scene.style.opacity = opacity;
      const sceneY=state.index===17?(index===17?contactScroll.brandY:index===18?contactScroll.contactY:0):0;
      scene.style.transform=`translateY(${sceneY}px)`;
      scene.classList.toggle('is-visible', opacity > 0);
      const logicalCurrent=state.transition>=.5?Math.min(state.index+1,scenes.length-1):state.index;
      const visualCurrent=logicalCurrent>=3&&logicalCurrent<=5?3:logicalCurrent;
      const current=index===visualCurrent&&opacity>0;
      scene.classList.toggle('is-current',current);
      scene.inert=!current;
      scene.setAttribute('aria-hidden',String(!current));
      // 원본 HTML 레이어를 이동합니다. 요소 복제나 별도 화면 재배치는 하지 않습니다.
      const offset = index < state.index ? Math.max(0, heights[index] - 1020) : index === state.index ? state.offset : 0;
      scene.querySelector('.frame-art').style.setProperty('--content-offset', `${-offset}px`);
    });
    renderIntro(state.index < 1 ? 0 : state.index === 1 ? state.offset : segments[1].travel);
    renderHistory(state);
    renderHistoryContents(state);
    renderHistoryZoom(state);
    renderDaejeon(state);
    renderDaejeonHandoff(state);
    renderWrapperTear(state);
    renderBrand(state);
    stage.dataset.currentFrame = scenes[state.index].dataset.frameName;
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(render); } }
  function resize() {
    // 원본 비율을 유지하며 작은 화면에서도 동일한 레이어만 표시합니다.
    stage.style.setProperty('--frame-scale', Math.min(innerWidth / 2064, innerHeight / 1020));
    render();
  }
  function navigate(hash, push = true) {
    const target = scenes.find(scene => `#${scene.id}` === hash);
    if (!target) return;
    if (push) history.pushState(null, '', hash);
    window.scrollTo({ top: segments[Number(target.dataset.scene)].start, behavior: reduced.matches ? 'instant' : 'smooth' });
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); navigate(link.getAttribute('href')); }));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('popstate', () => navigate(location.hash || '#landing', false));
  // 숫자는 200, 한글은 폰트별 지정 굵기로 표시하고 영문 굵기는 유지합니다.
  const lightCharacters=/([0-9\uff10-\uff19]+|[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7ff]+)/;
  const koreanCharacters=/[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7ff]/;
  const textWalker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const lightTextNodes=[];
  while(textWalker.nextNode()){
    const node=textWalker.currentNode;
    if(!node.parentElement.closest('script, style, noscript')&&lightCharacters.test(node.textContent))lightTextNodes.push(node);
  }
  lightTextNodes.forEach(node=>{
    const fragment=document.createDocumentFragment();
    node.textContent.split(lightCharacters).forEach(part=>{
      if(!part)return;
      if(lightCharacters.test(part)){
        const span=document.createElement('span');span.className='light-korean-number';
        if(koreanCharacters.test(part))span.classList.add('korean-glyph');
        span.textContent=part;fragment.append(span);
      }else fragment.append(document.createTextNode(part));
    });
    node.replaceWith(fragment);
  });
  resize();
  if (location.hash) navigate(location.hash, false);
})();
