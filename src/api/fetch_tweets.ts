import { BuiltInPowerupCodes, Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import { getOrCreateByName } from './api_helpers';
import { getOrCreateRemNotePairKey } from './auth';
import {
  CONNECTED_TO_TWITTER_STORAGE,
  LAST_TWEET_FETCH_TIME_STORAGE,
  LAST_TWITTER_FETCH_ERROR,
} from './storage';

const TWEET_FETCH_URL = 'https://remnotetwitterbot2.herokuapp.com/tweets/fetch';

type TweetJSON =
  | {
      type: SaveTweetCommand.Learn;
      generatedCard?: {
        question: string;
        answer: string;
      };
      childrenTweets?: TweetResponse[];
    }
  | {
      type: SaveTweetCommand.Save;
      saveLocation?: string;
      note?: string;
      childrenTweets?: TweetResponse[];
    };

enum SaveTweetCommand {
  Learn = 'learn',
  Save = 'save',
}

interface TweetResponse {
  time: number;

  twitterUserId: string;
  tweet: { tweetText: string; url: string; author: string };
  tweetText: string;
  info: TweetJSON;
}

export const TWEETS_FOLDER = ['Saved Tweets'];

let fetching = false;
export async function fetchTweets(plugin: RNPlugin) {
  if (fetching) return;
  fetching = true;

  const key = await getOrCreateRemNotePairKey(plugin);

  //   await plugin.transaction(async () => {
  const time = parseInt((await plugin.storage.getSynced(LAST_TWEET_FETCH_TIME_STORAGE)) ?? '0');

  try {
    const { tweets, err }: { tweets?: TweetResponse[]; err?: string } = await (
      await fetch(`${TWEET_FETCH_URL}?remnotePairKey=${key}&time=${time}`)
    ).json();

    if (err) {
      await plugin.storage.setSynced(CONNECTED_TO_TWITTER_STORAGE, false);
      await plugin.storage.setSynced(LAST_TWITTER_FETCH_ERROR, err);
    } else if (tweets) {
      for (const tweet of tweets) {
        await createTweet(plugin, tweet);
      }

      await plugin.storage.setSynced(LAST_TWEET_FETCH_TIME_STORAGE, new Date().getTime());
      await plugin.storage.setSynced(CONNECTED_TO_TWITTER_STORAGE, true);
      await plugin.storage.setSynced(LAST_TWITTER_FETCH_ERROR, undefined);

      const savedTweetsRem = await getOrCreateByName(plugin, TWEETS_FOLDER);
      await savedTweetsRem?.setIsDocument(true);
    } else {
      await plugin.storage.setSynced(LAST_TWITTER_FETCH_ERROR, 'Tweets not in response');
    }
  } catch (e: any) {
    if (e?.message) {
      await plugin.storage.setSynced(LAST_TWITTER_FETCH_ERROR, e?.message);
    } else {
      console.error(e);
    }
  }

  fetching = false;
}

async function createWithMarkdown(plugin: RNPlugin, text: string) {
  const [first, ...rest] = text.split('\n');
  const rem = await plugin.rem.createSingleRemWithMarkdown(first);

  for (const r of rest) {
    if (r.trim() != '') {
      const child = await plugin.rem.createSingleRemWithMarkdown(r);
      await child?.setParent(rem!);
    }
  }

  return rem;
}

async function createTweet(plugin: RNPlugin, tweet: TweetResponse, parent?: Rem) {
  const savedTweetsRem = await getOrCreateByName(plugin, TWEETS_FOLDER);

  const tweetRem = (await createWithMarkdown(
    plugin,
    `${tweet.tweetText} [↪](${tweet.tweet.url}) - [[@${tweet.tweet.author}]]`
  ))!;

  await tweetRem.setPowerupProperty('tweet', 'link', [tweet.tweet.url ?? '']);

  if (tweet.info.type == SaveTweetCommand.Learn && tweet.info.generatedCard) {
    const questionRem = await createWithMarkdown(
      plugin,
      `${tweet.info.generatedCard.question} >> ${tweet.info.generatedCard.answer}`
    );
    await questionRem?.setParent(savedTweetsRem ?? null);

    await tweetRem?.setParent(parent ?? questionRem!);

    await tweetRem?.addPowerup(BuiltInPowerupCodes.ExtraCardDetail);
  } else {
    // @ts-ignore
    const saveLocation = tweet.info.saveLocation;
    const saveLocationRem = saveLocation
      ? await getOrCreateByName(plugin, [saveLocation?.trim()])
      : savedTweetsRem;

    //   console.log('saveLocation', saveLocation, saveLocationRem);

    await saveLocationRem?.setIsDocument(true);

    await tweetRem?.setParent(parent ?? saveLocationRem ?? null);

    if ('note' in tweet.info && tweet.info.note?.trim()) {
      // @ts-ignore
      const noteRem = await createWithMarkdown(plugin, tweet.info.note);
      await noteRem?.setParent(tweetRem ?? null);
    }
  }

  for (const children of tweet.childrenTweets || []) {
    await createTweet(plugin, children, tweetRem);
  }
}
