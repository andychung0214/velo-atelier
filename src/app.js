import { DEFAULT_CONFIG } from './core/config.js';
import { PART_CATALOG } from './data/parts.js';

document.documentElement.classList.remove('no-js');
document.documentElement.dataset.appPhase = 'loading';

const canvas = document.querySelector('#bike-canvas');
const stage = document.querySelector('.bike-stage');
const fallback = document.querySelector('#scene-fallback');
const fallbackMessage = fallback?.querySelector('[data-fallback-message]');
const detail = document.querySelector('#part-detail');
const rotateButton = document.querySelector('[data-action="toggle-rotate"]');
let sceneController = null;

function showSceneError(error) {
  if (fallbackMessage) {
    fallbackMessage.textContent = error?.message
      ? `3D 引擎回報：${error.message} 請確認網路與硬體加速後重新整理。`
      : '請確認瀏覽器支援 WebGL、已啟用硬體加速，並重新整理頁面。';
  }
  if (fallback) fallback.hidden = false;
  document.documentElement.dataset.appPhase = 'fallback';
}

function renderPartDetail(partId) {
  const part = PART_CATALOG[partId];
  if (!part || !detail) return;
  detail.querySelector('.detail-eyebrow').textContent = part.eyebrow;
  detail.querySelector('h3').textContent = part.name;
  detail.querySelector('.detail-copy').textContent = part.description;
  detail.querySelector('.detail-tip').innerHTML = '';
  const label = document.createElement('span');
  label.textContent = '工房筆記';
  detail.querySelector('.detail-tip').append(label, document.createTextNode(part.tip));
  stage.dataset.selectedPart = partId;
  sceneController?.selectPart(partId);
}

async function bootstrapScene() {
  try {
    const { createSceneController } = await import('./scene/scene-controller.js');
    sceneController = await createSceneController({
      canvas,
      config: DEFAULT_CONFIG,
      onPartSelect: renderPartDetail,
      onError: showSceneError,
    });
    renderPartDetail('frame');
    document.documentElement.dataset.appPhase = 'scene-ready';
  } catch (error) {
    showSceneError(error);
  }
}

document.querySelector('[data-action="reset-view"]')?.addEventListener('click', () => {
  sceneController?.resetView();
});

rotateButton?.addEventListener('click', () => {
  const next = rotateButton.getAttribute('aria-pressed') !== 'true';
  const active = sceneController?.setAutoRotate(next) ?? false;
  rotateButton.setAttribute('aria-pressed', String(active));
});

bootstrapScene();
