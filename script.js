/* 내부 스크롤 완료 → 마지막 화면 1,500px 고정 → 다음 화면 전환. Landing은 고정 제외. */
(() => {
  'use strict';
  const TRANSITION_SCROLL_PX = 250;
  const HOLD_SCROLL_PX = 1500;
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
      const hold = index === 0 || index === 6 ? 0 : index >= 3 && index <= 5 ? 800 : HOLD_SCROLL_PX;
      const travel = Math.max(0, height - 1020);
      const motion = index === 2 ? 2800 : index === 3 ? 900 : index === 4 ? 4600 : index === 5 ? 8200 : index === 6 || index === 7 ? 1000 : index === 8 ? 1700 : 0;
      const transition = index === heights.length - 1 || index === 6 ? 0 : index === 9 ? 600 : index === 13 ? 1000 : TRANSITION_SCROLL_PX;
      const exitMotion = index === 8 ? 2400 : 0;
      const segment = { start, hold, travel, motion, exitMotion, transition, length: hold + travel + motion + exitMotion + transition };
      start += segment.length;
      return segment;
    });
  }
  function stateAt(scrollPx, heights) {
    const segments = timeline(heights);
    let index = segments.findIndex(segment => scrollPx < segment.start + segment.length);
    if (index < 0) index = segments.length - 1;
    const segment = segments[index];
    const local = clamp(scrollPx - segment.start, 0, segment.length);
    const offset = clamp(local, 0, segment.travel);
    const transition = segment.transition ? clamp((local - segment.hold - segment.travel - segment.motion - segment.exitMotion) / segment.transition) : 0;
    return { index, local, transition, offset };
  }
  function transitionWeights(index, progress) {
    if (index === 13) {
      // Table_tilt → 검정 → Our Way_start. 역방향 스크롤도 동일합니다.
      const outgoing = 1 - ease(clamp(progress / .45));
      const incoming = ease(clamp((progress - .55) / .45));
      const black = progress < .45 ? 1 - outgoing : progress > .55 ? 1 - incoming : 1;
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
      titleX:mix(114,68), titleY:mix(377,252), titleSize:mix(240,36), titleAlpha:mix(1,.59),
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
      align:ease(clamp((elapsed-1250)/800)),fade:ease(clamp((elapsed-2050)/350))};
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
  function headerPose(index, progress) {
    const t = ease(clamp(progress));
    const mix = (a,b) => a + (b-a)*t;
    const group = i => i >= 18 ? 4 : i >= 17 ? 3 : i >= 9 ? 2 : i >= 2 ? 1 : 0;
    const light = mix(index === 16 ? 1 : 0, index + 1 === 16 ? 1 : 0);
    return { width: mix(index === 0 ? 365.299 : 124, 124), height: mix(index === 0 ? 147 : 50, 50), light,
      active: Array.from({length:5},(_,i) => mix(group(index)===i?1:0, group(index+1)===i?1:0)) };
  }
  if (typeof module !== 'undefined') module.exports = { ease, HOLD_SCROLL_PX, TRANSITION_SCROLL_PX, timeline, stateAt, transitionWeights, introPose, introLinePose, headerPose, historyPose, historyExitPose, historyContentPose, historyCarouselFocus, historyCarouselGeometry, historyZoomPose, shouldExpandHistoryPhoto, historyImageCrops, daejeonPose, daejeonExitPose, daejeonAlignedCrop, daejeonAlignedLogoRect };
  if (typeof document === 'undefined') return;
  const scenes = Array.from(document.querySelectorAll('.scene'));
  const heights = scenes.map(scene => Number(scene.dataset.frameHeight));
  const segments = timeline(heights);
  document.querySelectorAll('.scroll-chapter').forEach((chapter, index) => { chapter.style.height = segments[index].length + 'px'; });
  const stage = document.querySelector('.design-stage');
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
    const elapsed=state.index<8?0:state.index===8?Math.max(0,state.local-segments[8].motion-segments[8].hold):2400;
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
    const elapsed=state.index<8?0:state.index===8?Math.max(0,state.local-segments[8].motion-segments[8].hold):2400;
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
  const header = document.querySelector('.persistent-header');
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
    scenes.forEach((scene, index) => {
      let opacity = index === state.index ? weights.outgoing : index === state.index + 1 ? weights.incoming : 0;
      if(state.index>=3 && state.index<=5) {
        if(index===3)opacity=state.index===5?weights.outgoing:1;
        if(index===4||index===5)opacity=0;
      }
      scene.style.opacity = opacity;
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
  resize();
  if (location.hash) navigate(location.hash, false);
})();
