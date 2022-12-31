import { declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { fetchEmails } from '../api/fetch_emails';
import { fetchTweets } from '../api/fetch_tweets';
import { PROMPTED_TO_CONNECT_TO_TWITTER } from '../api/storage';
import '../App.css';
import '../style.css';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerWidget('install', WidgetLocation.Popup, {
    dimensions: { height: 'auto', width: '350px' },
  });
  await plugin.app.registerWidget('installEmail', WidgetLocation.Popup, {
    dimensions: { height: 'auto', width: '350px' },
  });
  await plugin.app.registerWidget('right_sidebar', WidgetLocation.RightSidebar, {
    dimensions: { height: '100%', width: '100%' },
    widgetTabIcon: 'https://i.imgur.com/hY8ss08.png',
  });

  await fetchTweets(plugin);
  await fetchEmails(plugin);

  const promptedTwitterConnected = await plugin.storage.getSynced(PROMPTED_TO_CONNECT_TO_TWITTER);

  if (!promptedTwitterConnected) {
    await plugin.widget.openPopup('install');
    await plugin.storage.setSynced(PROMPTED_TO_CONNECT_TO_TWITTER, true);
  }

  // // Show a toast notification to the user.
  // await plugin.app.toast("I'm a toast!");
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
