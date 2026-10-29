/* 내부 스크롤 완료 → 마지막 화면 1,500px 고정 → 다음 화면 전환. Landing은 고정 제외. */
(() => {
  'use strict';
  const TRANSITION_SCROLL_PX = 250;
  const HOLD_SCROLL_PX = 1500;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = value => value * value * (3 - 2 * value);
  function timeline(heights) {
    let start = 0;
    return heights.map((height, index) => {
      const hold = index === 0 ? 0 : index >= 3 && index <= 5 ? 1000 : HOLD_SCROLL_PX;
      const travel = Math.max(0, height - 1020);
      const motion = index === 2 ? 2400 : index === 3 ? 900 : index === 4 ? 4100 : index === 5 ? 7500 : 0;
      const transition = index === heights.length - 1 ? 0 : TRANSITION_SCROLL_PX;
      const segment = { start, hold, travel, motion, transition, length: hold + travel + motion + transition };
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
    const transition = segment.transition ? clamp((local - segment.hold - segment.travel - segment.motion) / segment.transition) : 0;
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
    return { outgoing: 1 - ease(progress), incoming: ease(progress), black: 0 };
  }
  function introPose(offset, travel) {
    const progress = clamp(travel ? offset / travel : 0);
    const settle = ease(clamp((progress - .76) / .24));
    return { progress, breadX: 1035, breadY: 326 + 24 * settle, breadRotation: 360 * progress };
  }
  function introLinePose(progress, enter, exit, line, initiallyVisible = false) {
    const stagger = line * .025;
    const incoming = initiallyVisible ? 1 : ease(clamp((progress - enter - stagger) / .12));
    const outgoing = exit === null ? 0 : ease(clamp((progress - exit - stagger) / .12));
    return { opacity: incoming * (1 - outgoing), y: (1 - incoming) * 40 - outgoing * 40 };
  }
  function historyPose(local, arrival = 1) {
    const morph = ease(clamp(arrival));
    return { outline: ease(clamp((local - 1000) / 600)), text: ease(clamp((local - 1600) / 800)),
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
    const step=Math.min(count,Math.floor(Math.max(0,local)/1700));
    return base+Math.min(count,step+clamp((local-step*1700)/700));
  }
  function historyCarouselGeometry(focus, index) {
    const from=Math.min(7,Math.floor(clamp(focus,0,8))), t=ease(clamp(focus-from));
    function at(active) {
      const width=index===active?600:250, height=index===active?720:300;
      const start=732-active*280;
      const x=start+index*280+(index>active?350:0);
      return {x,y:(720-height)/2,width,height,opacity:index===active?1:.6};
    }
    const a=at(from),b=at(from+1);
    return Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*t]));
  }
  function headerPose(index, progress) {
    const t = ease(clamp(progress));
    const mix = (a,b) => a + (b-a)*t;
    const group = i => i >= 18 ? 4 : i >= 17 ? 3 : i >= 9 ? 2 : i >= 2 ? 1 : 0;
    const light = mix(index === 16 ? 1 : 0, index + 1 === 16 ? 1 : 0);
    return { width: mix(index === 0 ? 365.299 : 124, 124), height: mix(index === 0 ? 147 : 50, 50), light,
      active: Array.from({length:5},(_,i) => mix(group(index)===i?1:0, group(index+1)===i?1:0)) };
  }
  if (typeof module !== 'undefined') module.exports = { HOLD_SCROLL_PX, TRANSITION_SCROLL_PX, timeline, stateAt, transitionWeights, introPose, introLinePose, headerPose, historyPose, historyExitPose, historyContentPose, historyCarouselFocus, historyCarouselGeometry };
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
    const local = state.index < 2 ? 0 : state.index === 2 ? state.local : 2400;
    const pose = historyPose(local, arrival);
    historyBread.style.setProperty('--history-bread-x', pose.breadX + 'px');
    historyBread.style.setProperty('--history-bread-y', pose.breadY + 'px');
    historyBread.style.setProperty('--history-bread-width', pose.breadWidth + 'px');
    historyBread.style.setProperty('--history-bread-height', pose.wrappedHeight + 'px');
    historyOutline.style.setProperty('--outline-length', pose.outline * 100 + '%');
    historyTitle.style.setProperty('--title-shift', (reduced.matches ? 0 : (1 - pose.text) * 2064) + 'px');
    historyTitle.style.opacity = pose.text;
    historyTitle.classList.toggle('is-glowing', state.index === 2 && local >= 2400);
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
      scene.classList.toggle('is-current', opacity >= .5);
      scene.inert = opacity < .5;
      scene.setAttribute('aria-hidden', String(opacity < .5));
      // 원본 HTML 레이어를 이동합니다. 요소 복제나 별도 화면 재배치는 하지 않습니다.
      const offset = index < state.index ? Math.max(0, heights[index] - 1020) : index === state.index ? state.offset : 0;
      scene.querySelector('.frame-art').style.setProperty('--content-offset', `${-offset}px`);
    });
    renderIntro(state.index < 1 ? 0 : state.index === 1 ? state.offset : segments[1].travel);
    renderHistory(state);
    renderHistoryContents(state);
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
