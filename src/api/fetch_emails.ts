import { RNPlugin } from '@remnote/plugin-sdk';
import { getOrCreateByName } from './api_helpers';
import { getOrCreateRemNotePairKey } from './auth';
import {
  CONNECTED_TO_EMAIL_STORAGE,
  LAST_EMAIL_FETCH_ERROR,
  LAST_EMAIL_FETCH_TIME_STORAGE,
  LAST_TWEET_FETCH_TIME_STORAGE,
} from './storage';

const EMAIL_FETCH_URL = 'https://b794-173-75-243-94.ngrok.io/emails/fetch';
// const EMAIL_FETCH_URL = 'https://remnoteemailbot2.herokuapp.com/emails/fetch';

interface EmailResponse {
  time: number;

  text: string;
  html: string;
  textAsHtml: string;
  from: string;
  subject: string;
  date: string;
}

export const EMAILS_FOLDER = ['Saved Emails'];

export async function fetchEmails(plugin: RNPlugin) {
  const key = await getOrCreateRemNotePairKey(plugin);

  //   await plugin.transaction(async () => {
  const time = parseInt((await plugin.storage.getSynced(LAST_EMAIL_FETCH_TIME_STORAGE)) ?? '0');

  try {
    const { emails, err }: { emails?: EmailResponse[]; err?: string } = await (
      await fetch(`${EMAIL_FETCH_URL}?remnotePairKey=${key}&time=${time}`)
    ).json();

    if (err) {
      await plugin.storage.setSynced(CONNECTED_TO_EMAIL_STORAGE, false);
      await plugin.storage.setSynced(LAST_EMAIL_FETCH_ERROR, err);
    } else if (emails) {
      const savedEmailsRem = await getOrCreateByName(plugin, EMAILS_FOLDER);
      await savedEmailsRem?.setIsDocument(true);

      const emailTagRem = await getOrCreateByName(plugin, ['Email']);

      for (const email of emails) {
        const tweetRem = (await plugin.rem.createWithMarkdown(email.subject))!;
        await tweetRem?.setParent(savedEmailsRem);
        await tweetRem?.addTag(emailTagRem);

        const bodyRem = await plugin.rem.createWithMarkdown(email.text);
        await bodyRem?.setParent(tweetRem);
      }

      await plugin.storage.setSynced(LAST_EMAIL_FETCH_ERROR, new Date().getTime());
      await plugin.storage.setSynced(CONNECTED_TO_EMAIL_STORAGE, true);

      savedEmailsRem?.openRemAsPage();
    } else {
      await plugin.storage.setSynced(LAST_EMAIL_FETCH_ERROR, 'Tweets not in response');
    }
  } catch (e: any) {
    if (e?.message) {
      await plugin.storage.setSynced(LAST_EMAIL_FETCH_ERROR, e?.message);
    }
  }
}
