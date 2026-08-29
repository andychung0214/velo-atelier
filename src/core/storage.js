import { DEFAULT_CONFIG, normalizeConfig } from './config.js';

export const CONFIG_STORAGE_KEY = 'velo-atelier:config';
const STORAGE_VERSION = 1;

export function createConfigStorage(adapter, key = CONFIG_STORAGE_KEY) {
  return Object.freeze({
    load() {
      try {
        const raw = adapter.getItem(key);
        if (raw === null) {
          return { ...DEFAULT_CONFIG };
        }

        const payload = JSON.parse(raw);
        if (payload?.version !== STORAGE_VERSION) {
          return { ...DEFAULT_CONFIG };
        }

        return normalizeConfig(payload.config);
      } catch {
        return { ...DEFAULT_CONFIG };
      }
    },

    save(config) {
      try {
        const payload = JSON.stringify({
          version: STORAGE_VERSION,
          config: normalizeConfig(config),
        });
        adapter.setItem(key, payload);
        return true;
      } catch {
        return false;
      }
    },

    clear() {
      try {
        adapter.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  });
}
