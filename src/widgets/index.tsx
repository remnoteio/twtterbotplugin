import { declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { fetchTweets } from '../api/fetch_tweets';
import { getOrCreateTwitterBotKey } from '../api/auth';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerWidget('install', WidgetLocation.Popup, {
    dimensions: { height: 'auto', width: '250px' },
  });

  await getOrCreateTwitterBotKey(plugin);
  await plugin.widget.openPopup('install');

  void fetchTweets(plugin);

  // // Show a toast notification to the user.
  // await plugin.app.toast("I'm a toast!");
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
