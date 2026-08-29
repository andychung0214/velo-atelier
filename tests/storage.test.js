import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_CONFIG } from '../src/core/config.js';
import {
  CONFIG_STORAGE_KEY,
  createConfigStorage,
} from '../src/core/storage.js';

function createMemoryAdapter(entries = []) {
  const values = new Map(entries);

  return {
    values,
    adapter: {
      getItem(key) {
        return values.has(key) ? values.get(key) : null;
      },
      setItem(key, value) {
        values.set(key, value);
      },
      removeItem(key) {
        values.delete(key);
      },
    },
  };
}

test('儲存配置時加入版本並可重新載入', () => {
  const { adapter, values } = createMemoryAdapter();
  const storage = createConfigStorage(adapter);
  const config = { ...DEFAULT_CONFIG, brake: 'caliper', frameColor: '#123abc' };

  assert.equal(storage.save(config), true);
  assert.deepEqual(JSON.parse(values.get(CONFIG_STORAGE_KEY)), {
    version: 1,
    config,
  });
  assert.deepEqual(storage.load(), config);
});

test('損壞或不支援版本的資料回復預設配置', () => {
  const broken = createMemoryAdapter([[CONFIG_STORAGE_KEY, '{broken']]);
  const future = createMemoryAdapter([[
    CONFIG_STORAGE_KEY,
    JSON.stringify({ version: 99, config: { brake: 'caliper' } }),
  ]]);

  assert.deepEqual(createConfigStorage(broken.adapter).load(), DEFAULT_CONFIG);
  assert.deepEqual(createConfigStorage(future.adapter).load(), DEFAULT_CONFIG);
});

test('儲存空間不可用時回傳結果而不拋出錯誤', () => {
  const errorAdapter = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('full'); },
    removeItem() { throw new Error('blocked'); },
  };
  const storage = createConfigStorage(errorAdapter);

  assert.deepEqual(storage.load(), DEFAULT_CONFIG);
  assert.equal(storage.save(DEFAULT_CONFIG), false);
  assert.equal(storage.clear(), false);
});

test('clear 只移除疾輪工房使用的鍵值', () => {
  const { adapter, values } = createMemoryAdapter([
    [CONFIG_STORAGE_KEY, '{}'],
    ['unrelated', 'keep'],
  ]);
  const storage = createConfigStorage(adapter);

  assert.equal(storage.clear(), true);
  assert.equal(values.has(CONFIG_STORAGE_KEY), false);
  assert.equal(values.get('unrelated'), 'keep');
});
