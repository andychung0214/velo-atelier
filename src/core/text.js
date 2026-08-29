export const FONT_OPTIONS = Object.freeze([
  Object.freeze({
    value: 'corsa',
    label: 'Corsa Condensed',
    canvasFamily: '"Arial Narrow", "Noto Sans TC", "Noto Sans JP", sans-serif',
    cssFamily: '"Arial Narrow", "Roboto Condensed", "Noto Sans TC", sans-serif',
  }),
  Object.freeze({
    value: 'editorial',
    label: 'Editorial Serif',
    canvasFamily: 'Georgia, "Noto Serif TC", "Noto Serif JP", serif',
    cssFamily: 'Georgia, "Noto Serif TC", "Noto Serif JP", serif',
  }),
  Object.freeze({
    value: 'mono',
    label: 'Officina Mono',
    canvasFamily: '"Courier New", "Noto Sans Mono CJK TC", monospace',
    cssFamily: '"Courier New", "Noto Sans Mono CJK TC", monospace',
  }),
  Object.freeze({
    value: 'cjk',
    label: 'Neo CJK',
    canvasFamily: '"Noto Sans TC", "Noto Sans JP", "PingFang TC", "Microsoft JhengHei", sans-serif',
    cssFamily: '"Noto Sans TC", "Noto Sans JP", "PingFang TC", "Microsoft JhengHei", sans-serif',
  }),
]);

const BREAKING_WHITESPACE = /[\t\n\r\f\v]+/g;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000e-\u001f\u007f-\u009f]/g;

export function normalizeFrameText(value, maxLength = 24) {
  if (typeof value !== 'string') {
    return '';
  }

  const limit = Number.isInteger(maxLength) && maxLength > 0 ? maxLength : 24;
  const cleaned = value
    .replace(BREAKING_WHITESPACE, ' ')
    .replace(CONTROL_CHARACTERS, '')
    .replace(/\s+/gu, ' ')
    .trim();

  return Array.from(cleaned).slice(0, limit).join('');
}
