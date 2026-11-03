// 모델의 초기 자세(별도 X 80°)에 추가되는 스크롤 회전량입니다.
// 같은 01→02 스크롤 구간에서 X·Z축 각속도를 기존의 70%로 낮춥니다.
export const ROTATION_DEGREES = Object.freeze({ x: -301, y: 0, z: 247.1 });
const coefficients = [1];
for (let k = 1; k <= 21; k++) {
  coefficients[k] = coefficients[k - 1] * (22 - k) / k;
}

export function sectionProgress(scrollY, firstTop, secondTop) {
  if (secondTop <= firstTop) return 0;
  return Math.min(1, Math.max(0, (scrollY - firstTop) / (secondTop - firstTop)));
}

// Beta(12,10) / Beta(10,12) 누적 곡선: 속도 최대 지점 X 55%, Z 45%.
export function axisEase(progress, axis) {
  const t = Math.min(1, Math.max(0, progress));
  const start = axis === 'x' ? 12 : 10;
  let result = 0;
  for (let k = start; k <= 21; k++) {
    result += coefficients[k] * t ** k * (1 - t) ** (21 - k);
  }
  return result;
}

export function scrollRotation(progress) {
  const radians = Math.PI / 180;
  return {
    x: ROTATION_DEGREES.x * radians * axisEase(progress, 'x'),
    y: 0,
    z: ROTATION_DEGREES.z * radians * axisEase(progress, 'z')
  };
}
