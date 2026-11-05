(() => {
  'use strict';
  const canvas = document.querySelector('.cursor-glow');
  if (!canvas || !matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const target = { x: 0, y: 0 };
  const head = { x: 0, y: 0 };
  const trail = [];
  let active = false;
  let started = false;
  let frame = 0;
  let leftAt = 0;

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw(now) {
    frame = 0;
    context.clearRect(0, 0, innerWidth, innerHeight);
    if (!started) return;

    if (active) {
      head.x += (target.x - head.x) * .34;
      head.y += (target.y - head.y) * .34;
      const previous = trail[trail.length - 1];
      if (!previous || Math.hypot(head.x - previous.x, head.y - previous.y) > .6) {
        trail.push({ x: head.x, y: head.y, time: now });
      }
    }
    while (trail.length && now - trail[0].time > 320) trail.shift();

    const visibility = active ? 1 : Math.max(0, 1 - (now - leftAt) / 250);
    for (let index = 1; index < trail.length; index++) {
      const from = trail[index - 1];
      const to = trail[index];
      const age = Math.max(0, 1 - (now - to.time) / 320);
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.strokeStyle = `rgba(255, 198, 55, ${age * .42 * visibility})`;
      context.lineWidth = 1 + age * 3;
      context.lineCap = 'round';
      context.stroke();
    }

    if (visibility > 0) {
      const glow = context.createRadialGradient(head.x, head.y, 0, head.x, head.y, 19);
      glow.addColorStop(0, `rgba(255, 233, 139, ${.78 * visibility})`);
      glow.addColorStop(.22, `rgba(255, 200, 55, ${.36 * visibility})`);
      glow.addColorStop(1, 'rgba(255, 190, 40, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(head.x, head.y, 19, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = `rgba(255, 238, 163, ${visibility})`;
      context.beginPath();
      context.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
      context.fill();
    }

    if (active || trail.length || visibility > 0) frame = requestAnimationFrame(draw);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    target.x = event.clientX;
    target.y = event.clientY;
    if (!started) {
      head.x = target.x;
      head.y = target.y;
      started = true;
    }
    active = true;
    schedule();
  }, { passive: true });
  document.addEventListener('pointerleave', () => {
    active = false;
    leftAt = performance.now();
    schedule();
  });
  window.addEventListener('blur', () => {
    active = false;
    leftAt = performance.now();
    schedule();
  });
  window.addEventListener('resize', resize);
  resize();
})();
