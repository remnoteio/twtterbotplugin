import { RNPlugin } from '@remnote/plugin-sdk';
import { TWITTER_BOT_KEY_STORAGE } from './storage';

export async function getOrCreateTwitterBotKey(plugin: RNPlugin) {
  const key = await plugin.storage.getSynced(TWITTER_BOT_KEY_STORAGE);

  if (key) {
    return key;
  } else {
    const newKey = ('' + Math.random()).substring(2);
    await plugin.storage.setSynced(TWITTER_BOT_KEY_STORAGE, newKey);
    return newKey;
  }
}
