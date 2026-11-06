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
  utensilHoverDistance: 0.008,
  breadHoverDistance: 0.008,
  liftMultiplier: 4,
  exposure: 0.60,
  environmentIntensity: 0.38,
  light: { ambient: 0.32, key: 0.45, fill: 0.10, window: 0.55, ceiling: 0.35, shadowRadius: 2.5 }
};
