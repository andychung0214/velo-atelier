import { FONT_OPTIONS } from '../core/text.js';
import {
  COLOR_TARGETS,
  OPTION_CATALOG,
  PART_CATALOG,
} from '../data/parts.js';
import { PRESETS } from '../data/presets.js';

const SPEC_META = Object.freeze({
  frame: { label: '車架幾何', partId: 'frame' },
  brake: { label: '煞車系統', partId: 'brake' },
  wheel: { label: '輪組形式', partId: 'wheelset' },
  drivetrain: { label: '變速系統', partId: 'drivetrain' },
  cockpit: { label: '座艙形式', partId: 'cockpit' },
});

function optionLabel(key, value) {
  return OPTION_CATALOG[key]?.find((option) => option.value === value)?.label ?? value;
}

function presetMatches(config, preset) {
  return Object.entries(preset.config).every(([key, value]) => config[key] === value);
}

export function getConfiguratorModel(config) {
  return {
    presets: PRESETS.map((preset) => ({
      id: preset.id,
      name: preset.name,
      subtitle: preset.subtitle,
      frameColor: preset.config.frameColor,
      accentColor: preset.config.accentColor,
      selected: presetMatches(config, preset),
    })),
    specs: Object.entries(SPEC_META).map(([key, meta]) => ({
      key,
      label: meta.label,
      partId: meta.partId,
      options: OPTION_CATALOG[key].map((option) => ({
        ...option,
        selected: option.value === config[key],
      })),
    })),
    colors: COLOR_TARGETS.map((target) => ({
      ...target,
      value: config[target.key],
    })),
    fonts: FONT_OPTIONS.map((font) => ({
      ...font,
      selected: font.value === config.font,
    })),
    frameText: config.frameText,
  };
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderPresets(container, model) {
  const buttons = model.presets.map((preset) => {
    const button = createElement('button', 'preset-option');
    button.type = 'button';
    button.dataset.presetId = preset.id;
    button.setAttribute('aria-pressed', String(preset.selected));

    const swatch = createElement('span', 'preset-swatch');
    swatch.style.setProperty('--preset-primary', preset.frameColor);
    swatch.style.setProperty('--preset-accent', preset.accentColor);
    swatch.setAttribute('aria-hidden', 'true');

    const copy = createElement('span', 'preset-copy');
    copy.append(
      createElement('strong', '', preset.name),
      createElement('small', '', preset.subtitle),
    );
    button.append(swatch, copy, createElement('span', 'preset-arrow', '↗'));
    return button;
  });
  container.replaceChildren(...buttons);
}

function renderSpecs(container, model) {
  const groups = model.specs.map((spec) => {
    const fieldset = createElement('fieldset', 'spec-group');
    const legend = createElement('legend', 'spec-label', spec.label);
    const options = createElement('div', 'segmented-control');
    options.dataset.partId = spec.partId;

    for (const option of spec.options) {
      const button = createElement('button', 'spec-option');
      button.type = 'button';
      button.dataset.configKey = spec.key;
      button.dataset.configValue = option.value;
      button.dataset.partId = spec.partId;
      button.setAttribute('aria-pressed', String(option.selected));
      button.append(
        createElement('span', '', option.label),
        createElement('small', '', option.note),
      );
      options.append(button);
    }

    fieldset.append(legend, options);
    return fieldset;
  });
  container.replaceChildren(...groups);
}

function renderColors(container, model) {
  const controls = model.colors.map((color) => {
    const label = createElement('label', 'color-control');
    label.dataset.partId = color.partId;
    const input = document.createElement('input');
    input.type = 'color';
    input.name = color.key;
    input.value = color.value;
    input.dataset.partId = color.partId;
    input.setAttribute('aria-label', color.label);
    const copy = createElement('span', 'color-copy');
    copy.append(
      createElement('strong', '', color.label),
      createElement('small', 'color-value', color.value.toUpperCase()),
    );
    label.append(input, copy);
    return label;
  });
  container.replaceChildren(...controls);
}

function renderTextControls(container, model) {
  const textLabel = createElement('label', 'field-control');
  textLabel.htmlFor = 'frame-text-input';
  textLabel.append(createElement('span', '', '文字內容'));
  const textInput = document.createElement('input');
  textInput.id = 'frame-text-input';
  textInput.name = 'frameText';
  textInput.type = 'text';
  textInput.maxLength = 24;
  textInput.value = model.frameText;
  textInput.placeholder = 'VELO ATELIER／疾輪工房／風の道';
  textInput.autocomplete = 'off';
  textInput.dataset.partId = 'downTube';
  textLabel.append(textInput);

  const fontLabel = createElement('label', 'field-control');
  fontLabel.htmlFor = 'frame-font-select';
  fontLabel.append(createElement('span', '', '字體'));
  const select = document.createElement('select');
  select.id = 'frame-font-select';
  select.name = 'font';
  select.dataset.partId = 'downTube';
  for (const font of model.fonts) {
    const option = createElement('option', '', font.label);
    option.value = font.value;
    option.selected = font.selected;
    select.append(option);
  }
  fontLabel.append(select);
  container.replaceChildren(textLabel, fontLabel);
}

function renderPartDetail(detailRoot, partId) {
  const part = PART_CATALOG[partId];
  if (!part) return;
  detailRoot.querySelector('.detail-eyebrow').textContent = part.eyebrow;
  detailRoot.querySelector('h3').textContent = part.name;
  detailRoot.querySelector('.detail-copy').textContent = part.description;
  const tip = detailRoot.querySelector('.detail-tip');
  const label = createElement('span', '', '工房筆記');
  tip.replaceChildren(label, document.createTextNode(part.tip));
}

export function createConfigurator({
  root,
  detailRoot,
  initialConfig,
  onChange,
  onSelectPart,
  onAction,
}) {
  const presetRoot = root.querySelector('#preset-list');
  const specRoot = root.querySelector('#spec-controls');
  const colorRoot = root.querySelector('#color-controls');
  const textRoot = root.querySelector('#text-controls');
  const liveRoot = document.querySelector('#status-live');
  const summaryRoot = document.querySelector('#config-summary');
  const stageRoot = document.querySelector('.bike-stage');
  let currentConfig = { ...initialConfig };
  let selectedPartId = 'frame';
  let controlsMounted = false;

  function render(config) {
    const model = getConfiguratorModel(config);
    if (!controlsMounted) {
      renderPresets(presetRoot, model);
      renderSpecs(specRoot, model);
      renderColors(colorRoot, model);
      renderTextControls(textRoot, model);
      controlsMounted = true;
    }

    for (const preset of model.presets) {
      presetRoot.querySelector(`[data-preset-id="${preset.id}"]`)
        ?.setAttribute('aria-pressed', String(preset.selected));
    }

    for (const spec of model.specs) {
      for (const option of spec.options) {
        specRoot.querySelector(
          `[data-config-key="${spec.key}"][data-config-value="${option.value}"]`,
        )?.setAttribute('aria-pressed', String(option.selected));
      }
    }

    for (const color of model.colors) {
      const input = colorRoot.querySelector(`input[name="${color.key}"]`);
      if (input && input.value !== color.value) input.value = color.value;
      const value = input?.closest('.color-control')?.querySelector('.color-value');
      if (value) value.textContent = color.value.toUpperCase();
    }

    const textInput = textRoot.querySelector('input[name="frameText"]');
    if (textInput && textInput.value !== model.frameText) textInput.value = model.frameText;
    const fontSelect = textRoot.querySelector('select[name="font"]');
    if (fontSelect && fontSelect.value !== config.font) fontSelect.value = config.font;

    for (const key of ['frame', 'brake', 'wheel', 'drivetrain']) {
      const target = summaryRoot?.querySelector(`[data-summary="${key}"]`);
      if (target) target.textContent = optionLabel(key, config[key]);
    }
    document.querySelector('[data-action="toggle-rotate"]')
      ?.setAttribute('aria-pressed', String(config.autoRotate));
  }

  function selectPart(partId) {
    if (!PART_CATALOG[partId]) return;
    selectedPartId = partId;
    renderPartDetail(detailRoot, selectedPartId);
    stageRoot.dataset.selectedPart = selectedPartId;
    onSelectPart(selectedPartId);
  }

  function announce(message) {
    if (!liveRoot) return;
    liveRoot.textContent = '';
    requestAnimationFrame(() => {
      liveRoot.textContent = message;
    });
  }

  function handleClick(event) {
    const presetButton = event.target.closest('[data-preset-id]');
    if (presetButton) {
      onAction('apply-preset', presetButton.dataset.presetId);
      return;
    }

    const optionButton = event.target.closest('[data-config-key][data-config-value]');
    if (optionButton) {
      onChange({ [optionButton.dataset.configKey]: optionButton.dataset.configValue });
      selectPart(optionButton.dataset.partId);
      return;
    }

    const actionButton = event.target.closest('[data-action]');
    if (actionButton) onAction(actionButton.dataset.action);
  }

  function handleInput(event) {
    const target = event.target;
    if (target.matches('input[type="color"]')) {
      target.closest('.color-control').querySelector('.color-value').textContent = target.value.toUpperCase();
      onChange({ [target.name]: target.value });
      selectPart(target.dataset.partId);
    } else if (target.matches('input[name="frameText"]')) {
      onChange({ frameText: target.value });
      selectPart('downTube');
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (target.matches('select[name="font"]')) {
      onChange({ font: target.value });
      selectPart('downTube');
    }
  }

  root.addEventListener('click', handleClick);
  root.addEventListener('input', handleInput);
  root.addEventListener('change', handleChange);
  render(currentConfig);
  renderPartDetail(detailRoot, selectedPartId);

  return {
    update(config) {
      currentConfig = { ...config };
      render(currentConfig);
    },
    selectPart,
    announce,
    destroy() {
      root.removeEventListener('click', handleClick);
      root.removeEventListener('input', handleInput);
      root.removeEventListener('change', handleChange);
    },
  };
}
