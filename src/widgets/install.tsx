import {
  usePlugin,
  renderWidget,
  useTracker,
  useSessionStorageState,
  useSyncedStorageState,
} from '@remnote/plugin-sdk';
import React from 'react';
import { TWITTER_BOT_KEY_STORAGE } from '../api/storage';

export const SampleWidget = () => {
  const [twitterBotKey] = useSyncedStorageState<undefined | string>(
    TWITTER_BOT_KEY_STORAGE,
    undefined
  );

  const link =
    'https://twitter.com/messages/1020379844561944576-1296326708866539520?text=Press send to authenticate!: ' +
    twitterBotKey;

  return (
    <div className="m-4">
      <h1>Twitter Bot</h1>
      Hey! We need to do a 1-time connection to your Twitter account to get your tweets.
      <br />
      {/* <div className="my-2">
        <ul>
          <li>Save tweets</li>
          <li>Generate flashcards from tweets</li>
        </ul>
      </div> */}
      <br />
      {twitterBotKey ? (
        <a href={link} target="_blank">
          <div className="bg-blue-50 p-2 cursor-pointer text-white rounded mb-2 !no-underline text-center">
            Click here, then press "Send"
          </div>
        </a>
      ) : (
        <div className="m-2 gray-50">Loading...</div>
      )}
      <br />
    </div>
  );
};

renderWidget(SampleWidget);
