import { BuiltInPowerupCodes, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import { getOrCreateByName } from './api_helpers';
import { getOrCreateTwitterBotKey } from './auth';
import { LAST_FETCH_TIME_STORAGE } from './storage';

const FETCH_URL = 'https://remnotetwitterbot2.herokuapp.com/tweets/fetch';

type TweetJSON =
  | {
      type: SaveTweetCommand.Learn;
      generatedCard?: {
        question: string;
        answer: string;
      };
    }
  | {
      type: SaveTweetCommand.Save;
      saveLocation?: string;
      note?: string;
    };

enum SaveTweetCommand {
  Learn = 'learn',
  Save = 'save',
}

interface TweetResponse {
  time: number;

  twitterUserId: string;
  tweet: { tweetText: string; url: string };
  tweetText: string;
  info: TweetJSON;
}

export async function fetchTweets(plugin: RNPlugin) {
  const key = await getOrCreateTwitterBotKey(plugin);

  //   await plugin.transaction(async () => {
  const time = parseInt((await plugin.storage.getSynced(LAST_FETCH_TIME_STORAGE)) ?? '0');
  const { tweets }: { tweets: TweetResponse[] } = await (
    await fetch(`${FETCH_URL}?remnotePairKey=${key}&time=${time}`)
  ).json();

  console.log('tweets', tweets);

  const tweetsRem = await getOrCreateByName(plugin, ['Saved Tweets']);
  await tweetsRem?.setIsDocument(true);

  const tweetRem = await getOrCreateByName(plugin, ['Tweet']);

  for (const tweet of tweets) {
    const tweetRem = await plugin.rem.createWithMarkdown(
      `${tweet.tweetText} [Link](${tweet.tweet.url})`
    );

    await tweetRem?.addTag(tweetRem);

    if (tweet.info.type == SaveTweetCommand.Learn && tweet.info.generatedCard) {
      const questionRem = await plugin.rem.createWithMarkdown(
        `${tweet.info.generatedCard.question} >> ${tweet.info.generatedCard.answer}`
      );
      await questionRem?.setParent(tweetsRem ?? null);
      await tweetRem?.setParent(questionRem!);
      await tweetRem?.addPowerup(BuiltInPowerupCodes.ExtraCardDetail);
    } else {
      // @ts-ignore
      const saveLocation = tweet.info.saveLocation;
      const saveLocationRem = saveLocation
        ? await getOrCreateByName(plugin, [saveLocation])
        : tweetsRem;

      await tweetRem?.setParent(saveLocationRem ?? null);

      if ('note' in tweet.info && tweet.info.note?.trim()) {
        // @ts-ignore
        const noteRem = await plugin.rem.createWithMarkdown(tweet.info.note);
        await noteRem?.setParent(tweetRem ?? null);
      }
    }
  }

  await plugin.storage.setSynced(LAST_FETCH_TIME_STORAGE, new Date().getTime());

  tweetsRem?.openRemAsPage();
}
