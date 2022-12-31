import { renderWidget, usePlugin, useSyncedStorageState } from '@remnote/plugin-sdk';
import { fetchEmails } from '../api/fetch_emails';
import { CONNECTED_TO_EMAIL_STORAGE, REMNOTE_PAIR_KEY_STORAGE } from '../api/storage';
import { BlueButton } from '../ui/BlueButton';
import { useIntervalWhen } from 'rooks';

export const InstallEmailWidget = () => {
  const [twitterBotKey] = useSyncedStorageState<undefined | string>(
    REMNOTE_PAIR_KEY_STORAGE,
    undefined
  );

  const link = `mailto:save@remnote.com?subject=Press send to authenticate to RemNote!&body=${twitterBotKey}`;

  const [emailConnected] = useSyncedStorageState<boolean>(CONNECTED_TO_EMAIL_STORAGE, false);

  const plugin = usePlugin();
  useIntervalWhen(
    () => fetchEmails(plugin),
    5000, // run callback every 1 second
    true
  );

  return (
    <div className="m-4">
      <h1>Email to RemNote</h1>
      {emailConnected ? (
        <div> Connected!</div>
      ) : (
        <>
          Hey! We need to do a 1-time connection to confirm your email address.
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

renderWidget(InstallEmailWidget);
