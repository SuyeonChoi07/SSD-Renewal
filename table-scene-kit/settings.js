export const tableSettings = {
  modelUrl: new URL('./table_p.glb', import.meta.url).href,
  cameraPosition: [-0.0743, 20.6247, 0.0487],
  triggerPx: 300,
  durationMs: 1200,
  startZoom: 920,
  endZoom: 500,
  zoomEndAt: 0.6,
  endPitch: 60,
  endOffsetX: -0.125,
  objectScale: 0.8,
  liftMultiplier: 4,
  exposure: 1.2,
  light: { ambient: 0.8125, key: 0.75, fill: 0.325, shadowRadius: 7 }
};
