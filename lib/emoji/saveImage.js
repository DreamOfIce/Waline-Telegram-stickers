import axios from 'axios';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import logger from '../utils/logger.js';

global.downloadQueue = global.downloadQueue || new WeakMap();

/**
 * Download and save image from file_id
 * @param {String} fileId telegram file_id
 * @param {String} savePath path to save
 */
export default async function saveImage(fileId, savePath) {
  logger.debug(`Start downloading file ${fileId} from Telegram...`);

  let reslove;
  let reject;
  const dlPromise = new Promise((rslv, rej) => {
    reslove = rslv;
    reject = rej;
  });
  global.downloadQueue.set({ path: savePath }, dlPromise);

  const response = await axios.post(
    `${global.config.apiEndpoint}/bot${global.config.botToken}/getFile`,
    { file_id: fileId },
  );
  const remotePath = response.data.result.file_path;

  const format = remotePath.slice(remotePath.lastIndexOf('.') + 1);
  switch (format) {
    case 'webp':
    case 'webm': {
      await mkdir(dirname(savePath), { recursive: true });
      const writeStream = createWriteStream(savePath)
        .on('close', () => {
          logger.debug(`[downloader] Successful downloaded file ${fileId}.`);
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
  return dlPromise;
}
