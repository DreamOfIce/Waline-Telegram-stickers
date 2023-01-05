import axios from 'axios';
import WeakObject from 'weak-object';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import logger from '../utils/logger.js';
import convertWebm from './convertWebm.js'

global.downloadQueue = global.downloadQueue || new WeakObject();

/**
 * Download and save image from file_id
 * @param {string} fileId telegram file_id
 * @param {string} savePath path to save
 */
export default async function saveImage(fileId, savePath) {
  logger.debug(
    `[downloader] Start downloading file ${fileId} from Telegram...`,
  );

  let reslove;
  let reject;
  const dlPromise = new Promise((rslv, rej) => {
    reslove = rslv;
    reject = rej;
  });
  global.downloadQueue.set(savePath, dlPromise);

  const response = await axios.post(
    `${global.config.apiEndpoint}/bot${global.config.botToken}/getFile`,
    { file_id: fileId },
  );
  const remotePath = response.data.result.file_path;

  const format = remotePath.slice(remotePath.lastIndexOf('.') + 1);
  await mkdir(dirname(savePath), { recursive: true });
  switch (format) {
    case 'webm': {
      const { data } = await axios.get(
        `${global.config.apiEndpoint}/file/bot${global.config.botToken}/${remotePath}`,
        { responseType: 'arraybuffer' },
      );
      await convertWebm(savePath, data);
      reslove();
      logger.debug(
        `[downloader] Successful convert video ${fileId} to animated webp and save.`,
      );
      break;
    }
    case 'webp': {
      const writeStream = createWriteStream(savePath)
        .on('close', () => {
          logger.debug(
            `[downloader] Successful save file ${fileId} to ${savePath}.`,
          );
          reslove();
        })
        .on('error', (err) => {
          logger.error(
            `[downloader] Failed to download file ${fileId}: ${err.message}`,
          );
          reject();
        });
      const { data: imageStream } = await axios.get(
        `${global.config.apiEndpoint}/file/bot${global.config.botToken}/${remotePath}`,
        { responseType: 'stream' },
      );
      imageStream.pipe(writeStream);
      break;
    }
    case 'tgs':
      logger.warn(`[downloader] The tgs format is currently not supported.`);
      reject();
      break;
    default:
      logger.warn(`[downloader] Unsupport image format: ${format}.`);
      reject();
      break;
  }
  await dlPromise;
}
