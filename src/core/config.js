import { COLOR_TARGETS, OPTION_CATALOG } from '../data/parts.js';
import { PRESETS } from '../data/presets.js';

const OPTION_KEYS = Object.freeze(Object.keys(OPTION_CATALOG));
const OPTION_VALUES = Object.freeze(Object.fromEntries(
  OPTION_KEYS.map((key) => [
    key,
    new Set(OPTION_CATALOG[key].map(({ value }) => value)),
  ]),
));
const COLOR_KEYS = Object.freeze(COLOR_TARGETS.map(({ key }) => key));
const FONT_VALUES = new Set(['corsa', 'editorial', 'mono', 'cjk']);
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const DEFAULT_CONFIG = Object.freeze({ ...PRESETS[0].config });

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return DEFAULT_CONFIG.frameText;
  }

  return Array.from(value.trim()).slice(0, 24).join('');
}

export function normalizeConfig(candidate) {
  const source = isRecord(candidate) ? candidate : {};
  const config = { ...DEFAULT_CONFIG };

  for (const key of OPTION_KEYS) {
    if (OPTION_VALUES[key].has(source[key])) {
      config[key] = source[key];
    }
  }

  for (const key of COLOR_KEYS) {
    if (typeof source[key] === 'string' && HEX_COLOR.test(source[key])) {
      config[key] = source[key].toLowerCase();
    }
  }

  if (Object.hasOwn(source, 'frameText')) {
    config.frameText = normalizeText(source.frameText);
  }

  if (FONT_VALUES.has(source.font)) {
    config.font = source.font;
  }

  if (typeof source.autoRotate === 'boolean') {
    config.autoRotate = source.autoRotate;
  }

  return config;
}

export function updateConfig(current, patch) {
  const base = isRecord(current) ? current : DEFAULT_CONFIG;
  const changes = isRecord(patch) ? patch : {};
  return normalizeConfig({ ...base, ...changes });
}
