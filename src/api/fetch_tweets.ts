import { RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import { getOrCreateByName } from './api_helpers';
import { getOrCreateTwitterBotKey } from './auth';
import { LAST_FETCH_TIME_STORAGE } from './storage';

const FETCH_URL = 'https://remnotetwitterbot2.herokuapp.com/tweets/fetch';

interface TweetResponse {
  time: number;

  twitterUserId: string;
  tweet: { tweetText: string };
  tweetText: string;
  info: any;
}

export async function fetchTweets(plugin: RNPlugin) {
  const key = await getOrCreateTwitterBotKey(plugin);

  //   await plugin.transaction(async () => {
  const time = new Date().getTime();
  const tweets: TweetResponse[] = await (
    await fetch(`${FETCH_URL}?key=${key}&time=${time}`)
  ).json();

  const tweetsRem = await getOrCreateByName(plugin, ['Tweets']);
  await tweetsRem?.setIsDocument(true);

  for (const tweet of tweets) {
    const tweetRem = await plugin.rem.createWithMarkdown('My Tweet' + JSON.stringify(tweet));
    await tweetRem?.setParent(tweetsRem ?? null);
  }

  await plugin.storage.setSynced(LAST_FETCH_TIME_STORAGE, time);

  tweetsRem?.openRemAsPage();
}
