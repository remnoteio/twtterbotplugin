import { BuiltInPowerupCodes, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
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

export const TWEETS_FOLDER = ['Saved Tweets'];

export async function fetchTweets(plugin: RNPlugin) {
  const key = await getOrCreateRemNotePairKey(plugin);

  //   await plugin.transaction(async () => {
  const time = parseInt((await plugin.storage.getSynced(LAST_TWEET_FETCH_TIME_STORAGE)) ?? '0');

  try {
    const { tweets, err }: { tweets?: TweetResponse[]; err?: string } = await (
      await fetch(`${TWEET_FETCH_URL}?remnotePairKey=${key}&time=${time}`)
    ).json();

    //   console.log('tweets', tweets);
    if (err) {
      await plugin.storage.setSynced(CONNECTED_TO_TWITTER_STORAGE, false);
      await plugin.storage.setSynced(LAST_TWITTER_FETCH_ERROR, err);
    } else if (tweets) {
      const savedTweetsRem = await getOrCreateByName(plugin, TWEETS_FOLDER);
      await savedTweetsRem?.setIsDocument(true);

      const tweetTagRem = await getOrCreateByName(plugin, ['Tweet']);

      for (const tweet of tweets) {
        const tweetRem = await plugin.rem.createWithMarkdown(
          `${tweet.tweetText} [Link](${tweet.tweet.url})`
        );

        await tweetRem?.addTag(tweetTagRem);

        if (tweet.info.type == SaveTweetCommand.Learn && tweet.info.generatedCard) {
          const questionRem = await plugin.rem.createWithMarkdown(
            `${tweet.info.generatedCard.question} >> ${tweet.info.generatedCard.answer}`
          );
          await questionRem?.setParent(savedTweetsRem ?? null);
          await tweetRem?.setParent(questionRem!);
          await tweetRem?.addPowerup(BuiltInPowerupCodes.ExtraCardDetail);
        } else {
          // @ts-ignore
          const saveLocation = tweet.info.saveLocation;
          const saveLocationRem = saveLocation
            ? await getOrCreateByName(plugin, [saveLocation])
            : savedTweetsRem;

          //   console.log('saveLocation', saveLocation, saveLocationRem);

          await saveLocationRem?.setIsDocument(true);

          await tweetRem?.setParent(saveLocationRem ?? null);

          if ('note' in tweet.info && tweet.info.note?.trim()) {
            // @ts-ignore
            const noteRem = await plugin.rem.createWithMarkdown(tweet.info.note);
            await noteRem?.setParent(tweetRem ?? null);
          }
        }
      }

      await plugin.storage.setSynced(LAST_TWEET_FETCH_TIME_STORAGE, new Date().getTime());
      await plugin.storage.setSynced(CONNECTED_TO_TWITTER_STORAGE, true);

      savedTweetsRem?.openRemAsPage();
    } else {
      await plugin.storage.setSynced(LAST_TWITTER_FETCH_ERROR, 'Tweets not in response');
    }
  } catch (e: any) {
    if (e?.message) {
      await plugin.storage.setSynced(LAST_TWITTER_FETCH_ERROR, e?.message);
    }
  }
}
