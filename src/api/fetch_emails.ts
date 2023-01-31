import { RNPlugin } from '@remnote/plugin-sdk';
import { getOrCreateByName } from './api_helpers';
import { getOrCreateRemNotePairKey } from './auth';
import {
  CONNECTED_TO_EMAIL_STORAGE,
  LAST_EMAIL_FETCH_ERROR,
  LAST_EMAIL_FETCH_TIME_STORAGE,
  LAST_TWEET_FETCH_TIME_STORAGE,
} from './storage';
import TurndownService from 'turndown';
var turndownService = new TurndownService();

const EMAIL_FETCH_URL = 'https://remnotetwitterbot2.herokuapp.com/emails/fetch';

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

let fetching = false;
export async function fetchEmails(plugin: RNPlugin) {
  if (!(await plugin.kb.isPrimaryKnowledgeBase())) {
    return;
  }
  if (fetching) return;
  fetching = true;

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
        const tweetRem = (await plugin.rem.createSingleRemWithMarkdown(email.subject))!;
        await tweetRem?.setParent(savedEmailsRem);
        await tweetRem?.addTag(emailTagRem);
        // convert html to markdown
        const md = turndownService.turndown(email.html).trim();

        if (md.length > 0) {
          for (const line of md.split('\n')) {
            const bodyRem = await plugin.rem.createSingleRemWithMarkdown(line);
            await bodyRem?.setParent(tweetRem, 9999999999);
          }
        }
      }

      await plugin.storage.setSynced(LAST_EMAIL_FETCH_TIME_STORAGE, new Date().getTime());
      await plugin.storage.setSynced(CONNECTED_TO_EMAIL_STORAGE, true);
    } else {
      await plugin.storage.setSynced(LAST_EMAIL_FETCH_ERROR, 'Tweets not in response');
    }
  } catch (e: any) {
    if (e?.message) {
      await plugin.storage.setSynced(LAST_EMAIL_FETCH_ERROR, e?.message);
    }
  }

  fetching = false;
}
