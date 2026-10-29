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
      const hold = index === 0 ? 0 : HOLD_SCROLL_PX;
      const travel = Math.max(0, height - 1020);
      const transition = index === heights.length - 1 ? 0 : TRANSITION_SCROLL_PX;
      const segment = { start, hold, travel, transition, length: hold + travel + transition };
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
    const transition = segment.transition ? clamp((local - segment.hold - segment.travel) / segment.transition) : 0;
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
  if (typeof module !== 'undefined') module.exports = { HOLD_SCROLL_PX, TRANSITION_SCROLL_PX, timeline, stateAt, transitionWeights };
  if (typeof document === 'undefined') return;
  const scenes = Array.from(document.querySelectorAll('.scene'));
  const heights = scenes.map(scene => Number(scene.dataset.frameHeight));
  const segments = timeline(heights);
  document.querySelectorAll('.scroll-chapter').forEach((chapter, index) => { chapter.style.height = segments[index].length + 'px'; });
  const stage = document.querySelector('.design-stage');
  const veil = document.querySelector('.transition-blackout');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled = false;
  function render() {
    scheduled = false;
    const state = stateAt(window.scrollY, heights);
    const weights = transitionWeights(state.index, state.transition);
    veil.style.opacity = weights.black;
    scenes.forEach((scene, index) => {
      const opacity = index === state.index ? weights.outgoing : index === state.index + 1 ? weights.incoming : 0;
      scene.style.opacity = opacity;
      scene.classList.toggle('is-visible', opacity > 0);
      scene.classList.toggle('is-current', opacity >= .5);
      scene.inert = opacity < .5;
      scene.setAttribute('aria-hidden', String(opacity < .5));
      // 원본 HTML 레이어를 이동합니다. 요소 복제나 별도 화면 재배치는 하지 않습니다.
      const offset = index < state.index ? Math.max(0, heights[index] - 1020) : index === state.index ? state.offset : 0;
      scene.querySelector('.frame-art').style.setProperty('--content-offset', `${-offset}px`);
    });
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
