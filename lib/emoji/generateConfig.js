import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import db from '../utils/db.js';
import logger from '../utils/logger.js';

/**
 * Generate and save info.json from Waline(see https://waline.js.org/cookbook/customize/emoji.html)
 * @param {String} name name of sticker set
 * @returns {Promise<String>} info.json text
 */
export default async function generateConfig(name) {
  logger.debug(
    `[generator] Try to generate configuration file for emoji set ${name}...`,
  );
  const setInfo = await db.findOneAsync({ type: 'set', name });
  if (!setInfo) {
    throw new Error(`[generator] Record for emoji set ${name} not found!`);
  }
  const { description } = setInfo;
  const emojis = await db.findAsync({ type: 'emoji', set: name });
  const exts = new Set(emojis.map((emoji) => emoji.ext));
  const emojiJson = { name: description, prefix: `${name}_` };
  if (exts.size === 1) {
    Object.assign(emojiJson, {
      type: [...exts][0],
      items: emojis.map((emoji) => emoji.name).sort((a, b) => a - b),
    });
  } else {
    Object.assign(emojiJson, {
      items: emojis
        .map((emoji) => `${emoji.name}.${emoji.ext}`)
        .sort((a, b) => a - b),
    });
  }
  logger.debug(`[generator] Configuration for ${name}:%o`, emojiJson);

  await mkdir(join(global.config.dataDir, 'resource', name), {
    recursive: true,
  });
  await writeFile(
    join(global.config.dataDir, 'resource', name, 'info.json'),
    JSON.stringify(emojiJson),
  );
  logger.debug('[generator] Done.');
  return emojiJson;
}
