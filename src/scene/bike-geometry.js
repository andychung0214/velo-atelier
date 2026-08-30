const BASE_GEOMETRY = Object.freeze({
  wheelRadius: 0.82,
  rearAxle: Object.freeze([-1.23, 0.84]),
  frontAxle: Object.freeze([1.27, 0.84]),
  bottomBracket: Object.freeze([-0.27, 0.66]),
});

const FRAME_VARIANTS = Object.freeze({
  race: Object.freeze({
    seatTop: Object.freeze([-0.64, 1.94]),
    headTop: Object.freeze([0.81, 2.02]),
    headBottom: Object.freeze([0.92, 1.66]),
    forkCrown: Object.freeze([1, 1.68]),
    rearBrakeMount: Object.freeze([-1.11, 1.64]),
    frontBrakeMount: Object.freeze([1.03, 1.69]),
    tubeScale: 1,
  }),
  aero: Object.freeze({
    seatTop: Object.freeze([-0.61, 1.91]),
    headTop: Object.freeze([0.83, 1.98]),
    headBottom: Object.freeze([0.94, 1.64]),
    forkCrown: Object.freeze([1.01, 1.68]),
    rearBrakeMount: Object.freeze([-1.11, 1.64]),
    frontBrakeMount: Object.freeze([1.04, 1.69]),
    tubeScale: 1.14,
  }),
  endurance: Object.freeze({
    seatTop: Object.freeze([-0.66, 1.97]),
    headTop: Object.freeze([0.76, 2.1]),
    headBottom: Object.freeze([0.9, 1.69]),
    forkCrown: Object.freeze([0.99, 1.69]),
    rearBrakeMount: Object.freeze([-1.11, 1.64]),
    frontBrakeMount: Object.freeze([1.02, 1.7]),
    tubeScale: 0.98,
  }),
});

function copyPoint(point) {
  return [...point];
}

export function pointOnSegment(start, end, amount) {
  return [
    start[0] + (end[0] - start[0]) * amount,
    start[1] + (end[1] - start[1]) * amount,
  ];
}

export function getBikeGeometry(frame = 'race') {
  const variant = FRAME_VARIANTS[frame] ?? FRAME_VARIANTS.race;
  return {
    wheelRadius: BASE_GEOMETRY.wheelRadius,
    rearAxle: copyPoint(BASE_GEOMETRY.rearAxle),
    frontAxle: copyPoint(BASE_GEOMETRY.frontAxle),
    bottomBracket: copyPoint(BASE_GEOMETRY.bottomBracket),
    seatTop: copyPoint(variant.seatTop),
    headTop: copyPoint(variant.headTop),
    headBottom: copyPoint(variant.headBottom),
    forkCrown: copyPoint(variant.forkCrown),
    rearBrakeMount: copyPoint(variant.rearBrakeMount),
    frontBrakeMount: copyPoint(variant.frontBrakeMount),
    tubeScale: variant.tubeScale,
  };
}
