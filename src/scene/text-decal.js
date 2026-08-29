import { FONT_OPTIONS, normalizeFrameText } from '../core/text.js';

const LOGICAL_WIDTH = 1024;
const LOGICAL_HEIGHT = 256;

function defaultCanvasFactory() {
  return document.createElement('canvas');
}

function resolveFont(value) {
  return FONT_OPTIONS.find((font) => font.value === value) ?? FONT_OPTIONS[0];
}

export function createTextDecal(
  THREE,
  { text, color, font, start = null, end = null },
  {
    createCanvas = defaultCanvasFactory,
    pixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio,
  } = {},
) {
  const ratio = Math.min(Math.max(Number(pixelRatio) || 1, 1), 2);
  const canvas = createCanvas();
  canvas.width = LOGICAL_WIDTH * ratio;
  canvas.height = LOGICAL_HEIGHT * ratio;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('瀏覽器無法建立車架文字畫布。');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const geometry = new THREE.PlaneGeometry(1.16, 0.26);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.03,
    depthWrite: false,
    side: THREE.FrontSide,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const front = new THREE.Mesh(geometry, material);
  front.position.z = 0.112;
  front.renderOrder = 3;
  const back = new THREE.Mesh(geometry, material);
  back.position.z = -0.112;
  back.rotation.y = Math.PI;
  back.renderOrder = 3;

  const group = new THREE.Group();
  group.name = 'frame-lettering';
  group.add(front, back);

  if (start && end) {
    group.position.copy(start).add(end).multiplyScalar(0.5);
    group.rotation.z = Math.atan2(end.y - start.y, end.x - start.x);
  }

  let state = { text, color, font };

  function draw() {
    const normalized = normalizeFrameText(state.text, 24);
    const fontDefinition = resolveFont(state.font);
    context.setTransform?.(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `700 128px ${fontDefinition.canvasFamily}`;
    context.fillStyle = state.color;
    if (normalized) {
      context.fillText(normalized, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
    }
    texture.needsUpdate = true;
    front.visible = Boolean(normalized);
    back.visible = Boolean(normalized);
  }

  draw();
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(draw).catch(() => {});
  }

  return {
    group,
    meshes: [front, back],
    update(next) {
      state = { ...state, ...next };
      draw();
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
