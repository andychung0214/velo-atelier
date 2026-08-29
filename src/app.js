import { DEFAULT_CONFIG, normalizeConfig, updateConfig } from './core/config.js';
import { createConfigStorage } from './core/storage.js';
import { PART_CATALOG } from './data/parts.js';
import { PRESETS } from './data/presets.js';
import { createConfigurator } from './ui/configurator.js';

document.documentElement.classList.remove('no-js');
document.documentElement.dataset.appPhase = 'loading';

const canvas = document.querySelector('#bike-canvas');
const stage = document.querySelector('.bike-stage');
const fallback = document.querySelector('#scene-fallback');
const fallbackMessage = fallback?.querySelector('[data-fallback-message]');
const detail = document.querySelector('#part-detail');
const rotateButton = document.querySelector('[data-action="toggle-rotate"]');
let sceneController = null;
let config = { ...DEFAULT_CONFIG };
let configurator = null;

function getStorageAdapter() {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem() { throw new Error('storage blocked'); },
      setItem() { throw new Error('storage blocked'); },
      removeItem() { throw new Error('storage blocked'); },
    };
  }
}

const configStorage = createConfigStorage(getStorageAdapter());
config = configStorage.load();

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
  configurator?.selectPart(partId);
  sceneController?.selectPart(partId);
}

function commitConfig(nextConfig, announcement) {
  config = normalizeConfig(nextConfig);
  configurator?.update(config);
  sceneController?.update(config);
  const saved = configStorage.save(config);
  if (announcement) configurator?.announce(announcement);
  if (!saved) configurator?.announce('設定已套用，但目前瀏覽器無法儲存。');
}

function applyPatch(patch) {
  commitConfig(updateConfig(config, patch));
}

function handleAction(action, payload) {
  if (action === 'apply-preset') {
    const preset = PRESETS.find(({ id }) => id === payload);
    if (preset) commitConfig(preset.config, `已套用 ${preset.name}。`);
  } else if (action === 'reset-config') {
    configStorage.clear();
    commitConfig(DEFAULT_CONFIG, '已回復工房預設。');
  }
}

configurator = createConfigurator({
  root: document.querySelector('#configurator'),
  detailRoot: detail,
  initialConfig: config,
  onChange: applyPatch,
  onSelectPart: (partId) => sceneController?.selectPart(partId),
  onAction: handleAction,
});

async function bootstrapScene() {
  try {
    const { createSceneController } = await import('./scene/scene-controller.js');
    sceneController = await createSceneController({
      canvas,
      config,
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
  applyPatch({ autoRotate: !config.autoRotate });
});

bootstrapScene();
