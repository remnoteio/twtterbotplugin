import { RNPlugin } from '@remnote/plugin-sdk';
import { REMNOTE_PAIR_KEY_STORAGE } from './storage';

export async function getOrCreateRemNotePairKey(plugin: RNPlugin) {
  const key = await plugin.storage.getSynced(REMNOTE_PAIR_KEY_STORAGE);

  if (key) {
    return key;
  } else {
    const newKey = (
      ('' + Math.random()).substring(2) + ('' + Math.random()).substring(2)
    ).substring(0, 16);
    await plugin.storage.setSynced(REMNOTE_PAIR_KEY_STORAGE, newKey);
    return newKey;
  }
}
