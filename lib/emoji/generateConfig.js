import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import db from '../utils/db.js';

/**
 * Generate and save info.json from Waline(see https://waline.js.org/cookbook/customize/emoji.html)
 * @param {String} name name of sticker set
 * @returns {Promise<String>} info.json text
 */
export default async function generateConfig(name) {
  const setInfo = await db.findOneAsync({ type: 'set', name });
  if (!setInfo) {
    throw new Error(`Emoji set ${name} not found!`);
  }
  const { description } = setInfo;
  const emojis = await db.findAsync({ type: 'emoji', set: name });
  const exts = new Set(emojis.map((emoji) => emoji.ext));
  const emojiJson = { name: description, prefix: `${name}_` };
  if (exts.size === 1) {
    Object.assign(emojiJson, {
      type: exts[0],
      items: emojis.map((emoji) => emoji.name),
    });
  } else {
    Object.assign(emojiJson, {
      items: emojis.map((emoji) => `${emoji.name}.${emoji.ext}`).sort(),
    });
  }
  await mkdir(join(global.config.dataDir, 'resource', name), {
    recursive: true,
  });
  await writeFile(
    join(global.config.dataDir, 'resource', name, 'info.json'),
    JSON.stringify(emojiJson),
  );
  return emojiJson;
}
