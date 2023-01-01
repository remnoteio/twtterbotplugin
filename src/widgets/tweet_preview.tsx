import { renderWidget, useTracker, WidgetLocation } from '@remnote/plugin-sdk';
import { useState } from 'react';
import { TwitterTweetEmbed } from 'react-twitter-embed';

export const TweetPreviewWidget = () => {
  const focusedRemTwitterId = useTracker(async (plugin) => {
    const remId = (await plugin.widget.getWidgetContext<WidgetLocation.UnderRemEditor>())?.remId;
    const rem = await plugin.rem.findOne(remId);
    // const rem = await plugin.focus.getFocusedRem();
    const link = await rem?.getPowerupProperty('tweet', 'link');
    if (link) {
      return last(link.split('/'));
    }
  }, []);

  const previewTweets = useTracker((p) => p.settings.getSetting('previewTweets') ?? true, []);

  const [expand, setExpand] = useState(false);

  return (
    <>
      <div className="text-right">
        <span className="cursor-pointer px-2" onMouseOver={() => setExpand(!expand)}>
          {expand ? '' : '🐦'}
        </span>
      </div>
      {expand && focusedRemTwitterId && previewTweets ? (
        <TwitterTweetEmbed onLoad={function noRefCheck() {}} tweetId={focusedRemTwitterId} />
      ) : null}
    </>
  );
};

renderWidget(TweetPreviewWidget);

function last(t: string[]) {
  return t[t.length - 1];
}
