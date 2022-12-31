import { renderWidget, usePlugin, useSyncedStorageState } from '@remnote/plugin-sdk';
import { useIntervalWhen } from 'rooks';
import { fetchTweets } from '../api/fetch_tweets';
import { CONNECTED_TO_TWITTER_STORAGE, REMNOTE_PAIR_KEY_STORAGE } from '../api/storage';
import { BlueButton } from '../ui/BlueButton';

export const InstallWidget = () => {
  const [twitterBotKey] = useSyncedStorageState<undefined | string>(
    REMNOTE_PAIR_KEY_STORAGE,
    undefined
  );

  const link = `https://twitter.com/messages/${REMNOTE_BOT_DM_ID}?text=Press send to authenticate!: ${twitterBotKey}`;

  const [twitterConnected] = useSyncedStorageState<boolean>(CONNECTED_TO_TWITTER_STORAGE, false);

  const plugin = usePlugin();
  useIntervalWhen(
    () => fetchTweets(plugin),
    5000, // run callback every 1 second
    true
  );

  return (
    <div className="m-4">
      <h1>Twitter Bot</h1>
      {twitterConnected ? (
        <div> Connected!</div>
      ) : (
        <>
          Hey! We need to do a 1-time connection to your Twitter account to get your tweets.
          <br />
          <br />
          {twitterBotKey ? (
            <a href={link} target="_blank" className="!no-underline">
              <BlueButton>Click here, then press "Send"</BlueButton>
            </a>
          ) : (
            <div className="m-2 gray-50">Loading...</div>
          )}
          <br />
        </>
      )}
    </div>
  );
};

renderWidget(InstallWidget);
