import { declareIndexPlugin, ReactRNPlugin, RNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
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

  await plugin.app.registerPowerup('Tweet', 'tweet', 'Tweet', {
    slots: [{ code: 'link', hidden: true, name: 'Link', onlyProgrammaticModifying: true }],
  });

  await plugin.app.registerWidget('tweet_preview', WidgetLocation.UnderRemEditor, {
    dimensions: { height: 'auto', width: '100%' },
    powerupFilter: 'tweet',
  });

  await plugin.settings.registerBooleanSetting({
    id: 'previewTweets',
    title: 'Preview tweets under their Rem',
    defaultValue: true,
  });

  void loadTwitter(plugin);
  void fetchEmails(plugin);

  setInterval(() => {
    void loadTwitter(plugin);
    void fetchEmails(plugin);
  }, 60 * 1000);

  // // Show a toast notification to the user.
  // await plugin.app.toast("I'm a toast!");
}

async function loadTwitter(plugin: RNPlugin) {
  if (!(await plugin.kb.isPrimaryKnowledgeBase())) {
    return;
  }
  await fetchTweets(plugin);

  const promptedTwitterConnected = await plugin.storage.getSynced(PROMPTED_TO_CONNECT_TO_TWITTER);

  if (!promptedTwitterConnected) {
    await plugin.widget.openPopup('install');
    await plugin.storage.setSynced(PROMPTED_TO_CONNECT_TO_TWITTER, true);
  }
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
