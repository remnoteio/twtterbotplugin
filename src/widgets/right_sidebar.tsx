import { renderWidget, usePlugin, useSyncedStorageState, useTracker } from '@remnote/plugin-sdk';
import moment from 'moment';
import { TwitterTweetEmbed } from 'react-twitter-embed';
import { useIntervalWhen } from 'rooks';
import { getOrCreateByName } from '../api/api_helpers';
import { REMNOTE_BOT_NAME } from '../api/consts';
import { EMAILS_FOLDER, fetchEmails } from '../api/fetch_emails';
import { fetchTweets, TWEETS_FOLDER } from '../api/fetch_tweets';
import {
  CONNECTED_TO_EMAIL_STORAGE,
  CONNECTED_TO_TWITTER_STORAGE,
  LAST_EMAIL_FETCH_ERROR,
  LAST_EMAIL_FETCH_TIME_STORAGE,
  LAST_TWEET_FETCH_TIME_STORAGE,
  LAST_TWITTER_FETCH_ERROR,
} from '../api/storage';
import { BlueButton } from '../ui/BlueButton';

export const RightSidebarWidget = () => {
  const [twitterConnected] = useSyncedStorageState<boolean>(CONNECTED_TO_TWITTER_STORAGE, false);
  const [lastTwitterFetchError] = useSyncedStorageState<string>(LAST_TWITTER_FETCH_ERROR, '');
  const [twitterLastFetch] = useSyncedStorageState<number | undefined>(
    LAST_TWEET_FETCH_TIME_STORAGE,
    undefined
  );
  const twitterLastFetchedHuman = twitterLastFetch ? moment(twitterLastFetch).fromNow() : 'never';

  const plugin = usePlugin();
  const connectTwitter = async () => {
    await plugin.widget.openPopup('install');
  };

  const openTweets = async () => {
    const savedTweetsRem = await getOrCreateByName(plugin, TWEETS_FOLDER);
    savedTweetsRem?.openRemAsPage();
  };

  const [emailConnected] = useSyncedStorageState<boolean>(CONNECTED_TO_EMAIL_STORAGE, false);
  const [lastEmailFetchError] = useSyncedStorageState<string>(LAST_EMAIL_FETCH_ERROR, '');
  const [emailLastFetch] = useSyncedStorageState<number | undefined>(
    LAST_EMAIL_FETCH_TIME_STORAGE,
    undefined
  );
  const emailLastFetchedHuman = emailLastFetch ? moment(emailLastFetch).fromNow() : 'never';

  const connectEmail = async () => {
    await plugin.widget.openPopup('installEmail');
  };

  const openEmails = async () => {
    const savedEmailsRem = await getOrCreateByName(plugin, EMAILS_FOLDER);
    savedEmailsRem?.openRemAsPage();
  };

  useIntervalWhen(
    () => {
      fetchTweets(plugin);
      fetchEmails(plugin);
    },
    5000,
    true
  );

  const focusedRemTwitterId = useTracker(async (plugin) => {
    const rem = await plugin.focus.getFocusedRem();
    const link = await rem?.getPowerupProperty('tweet', 'link');
    if (link) {
      return last(link.split('/'));
    }
  }, []);

  return (
    <div className="m-4">
      <div className="float-right">
        <a
          href="https://remnote.com/plugins/save_to_remnote"
          target="_blank"
          className="!no-underline"
        >
          ?
        </a>
      </div>
      <h1>Save to RemNote</h1>
      <h2>
        <img src="https://i.imgur.com/JYdkyJv.png" height="16" className="mr-1" /> Twitter
      </h2>
      {twitterConnected ? (
        <div>
          Reply to any tweet with <b>@{REMNOTE_BOT_NAME} save</b> or{' '}
          <b>@{REMNOTE_BOT_NAME} learn"</b>.
          <br />
          <br />
          <div onClick={openTweets}>
            <BlueButton>Open Tweets</BlueButton>
          </div>
          {focusedRemTwitterId ? (
            <>
              <br />
              <TwitterTweetEmbed onLoad={function noRefCheck() {}} tweetId={focusedRemTwitterId} />
            </>
          ) : (
            <></>
          )}
          {twitterLastFetchedHuman != 'a few seconds ago' && (
            <>
              <br />
              <div className="rn-clr-content-tertiary">Last fetched: {twitterLastFetchedHuman}</div>
            </>
          )}
        </div>
      ) : (
        <>
          <div>Twitter is not connected.</div>
          <br />
          <div onClick={connectTwitter}>
            <BlueButton>Connect</BlueButton>
          </div>

          {lastTwitterFetchError && (
            <>
              <br />
              <br />
              <div>Last Fetch Error: {lastTwitterFetchError}</div>
            </>
          )}
        </>
      )}
      <br />
      <h2>
        <span className="mr-1">📧</span> Email
      </h2>
      {emailConnected ? (
        <div>
          Email <b>save@remnote.com</b> to save emails to RemNote. <br />
          <br />
          <div onClick={openEmails}>
            <BlueButton>Open Emails</BlueButton>
          </div>
          {emailLastFetchedHuman != 'a few seconds ago' && (
            <>
              <br />
              <div className="rn-clr-content-tertiary">Last fetched: {emailLastFetchedHuman}</div>
            </>
          )}
        </div>
      ) : (
        <>
          <div>Email is not connected.</div>
          <br />
          <div onClick={connectEmail}>
            <BlueButton>Connect</BlueButton>
          </div>

          {lastEmailFetchError && (
            <>
              <br />
              <br />
              <div>Last Fetch Error: {lastEmailFetchError}</div>
            </>
          )}
        </>
      )}
    </div>
  );
};

renderWidget(RightSidebarWidget);

function last(t: string[]) {
  return t[t.length - 1];
}
