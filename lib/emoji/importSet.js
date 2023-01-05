import axios from 'axios';
import WeakObject from 'weak-object';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import logger from '../utils/logger.js';
import db from '../utils/db.js';
import generateConfig from './generateConfig.js';
import saveImage from './saveImage.js';

global.importQueue = global.importQueue || new WeakObject();

async function getStickerInfo(name) {
  try {
    const result = await axios.post(
      `${global.config.apiEndpoint}/bot${global.config.botToken}/getStickerSet`,
      { name },
    );
    return result.data.result;
  } catch (err) {
    switch (err.response && err.response.status) {
      case 401:
        throw new Error('Telegram bot authentication failed!');
      case 404: {
        const error = new Error(`Sticker set '${name}' not found.`);
        error.status = 404;
        throw error;
      }
      default:
        logger.error(err);
        throw err;
    }
  }
}
/**
 * Pull a sticker set
 * @param {string} name name of sticker set
 * @returns {Promise<string>} emoji's info.json text
 */
export default async function addStickerSet(name) {
  let reslove;
  const importPromise = new Promise((rslv) => {
    reslove = rslv;
  });
  global.importQueue.set(name, importPromise);

  logger.info(`[importer] Try to import emoji set ${name}.`);
  const info = await getStickerInfo(name);
  await mkdir(join(global.config.dataDir, 'resource', name), {
    recursive: true,
  });
  await Promise.all(
    info.stickers.map(async (emoji, i) => {
      try {
        await saveImage(
          emoji.file_id,
          join(global.config.dataDir, 'resource', emoji.set_name, `${i}.webp`),
        );
      } catch (err) {
        logger.warn(err);
        return;
      }

      await db.insertAsync({
        type: 'emoji',
        set: emoji.set_name,
        name: `${i}`,
        fileId: emoji.file_id,
      });
    }),
  );
  await db.insertAsync({
    type: 'set',
    name,
    description: info.title,
  });
  const emojiInfoJson = await generateConfig(name);
  logger.info(`[importer] Successful add emoji ${name}.`);
  reslove();
  return emojiInfoJson;
}
