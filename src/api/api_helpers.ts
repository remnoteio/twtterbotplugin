import { RNPlugin, RichTextInterface } from '@remnote/plugin-sdk';

export async function getOrCreateByName(plugin: RNPlugin, name: RichTextInterface) {
  const rem = await plugin.rem.findByName(name, null);
  if (rem) {
    return rem;
  } else {
    const x = await plugin.rem.createRem();
    await x?.setText(name);
    return x!;
  }
}
