import { fork } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';

const key = Symbol.for('_convertWebm');
if (!global[key])
  global[key] = {
    convertQueue: [],
    converting: Array.from({ length: global.config.maxFfmpeg }, () => false),
  };

/**
 * Convert webm video to animated webp
 * @param {string} savePath path to save the webp file
 * @param {Buffer} webmData raw data of webm video
 * @returns {Promise<void>}
 */
export default async function convertWebm(savePath, webmData) {
  let index = global[key].converting.findIndex((value) => !value);
  // If all slots are full, waiting
  if (index === -1) {
    let reslove;
    const waitPromise = new Promise((rslv) => {
      reslove = rslv;
    });
    global[key].convertQueue.push({
      path: savePath,
      promise: waitPromise,
      reslove,
    });
    index = await waitPromise;
  }
  global[key].converting[index] = true;

  // Converting
  await new Promise((reslove, reject) => {
    fork(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '..',
        '..',
        'lib',
        'utils',
        'ffmpeg.js',
      ),
      { silent: true, serialization: 'advanced' },
    )
      .on('message', (msg) =>
        logger.debug(`[convertor] ffmpeg-${index} ${msg}`),
      )
      .on('error', reject)
      .on('exit', (code) =>
        code === 0
          ? reslove(code)
          : reject(
              new Error(`[convertor] ffmpeg-${index} exit with code ${code}!`),
            ),
      )
      .send({
        input: {
          'tmp.webm': webmData,
        },
        output: {
          'tmp.webp': savePath,
        },
        job: [
          [
            '-loglevel',
            'error',
            '-i',
            'tmp.webm',
            '-vcodec',
            'libwebp',
            '-loop',
            '0',
            'tmp.webp',
          ],
        ],
      });
  });

  logger.debug(
    `[convertor] ffmpeg-${index} convert successful and result has been saved to ${savePath}.`,
  );
  global[key].converting[index] = false;

  // Start the first one in queue if available
  if (global[key].convertQueue.length > 0) {
    global[key].convertQueue.shift().reslove(index);
  }
}
