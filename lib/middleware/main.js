import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import generateConfig from '../emoji/generateConfig.js';
import importSet from '../emoji/importSet.js';
import saveImage from '../emoji/saveImage.js';
import db from '../utils/db.js';

const infoJsonPathRegExp = /^(?:\/([\w-]+)\/info\.json)$/i;
const emojiImagePathRegExp = /^(?:\/([\w-]+)\/(\w+)\.webp)$/i;

export default async (ctx, next) => {
  const isInfoJson = infoJsonPathRegExp.test(ctx.path);
  const isEmojiImage = emojiImagePathRegExp.test(ctx.path);
  if (isInfoJson) {
    const importPromise = global.importQueue.get(
      infoJsonPathRegExp.exec(ctx.path)[1],
    );
    if (importPromise) {
      await importPromise;
    }
  }
  if (isEmojiImage) {
    const downloadPromise = global.downloadQueue.get(ctx.path);
    if (downloadPromise) {
      await downloadPromise;
    }
  }

  await next();
  if (ctx.status === 404) {
    if (isInfoJson) {
      ctx.status = 200;
      const setName = infoJsonPathRegExp.exec(ctx.path)[1];
      const setInfo = await db.findOneAsync({ type: 'set', name: setName });
      if (setInfo) {
        ctx.body = await generateConfig(setName);
      } else {
        ctx.body = await importSet(setName);
      }
    } else if (isEmojiImage) {
      const [emojiSet, emojiName] = emojiImagePathRegExp
        .exec(ctx.path)
        .slice(1);
      const emojiInfo = await db.findOneAsync({
        type: 'emoji',
        set: emojiSet,
        name: emojiName,
      });
      if (emojiInfo) {
        await saveImage(
          emojiInfo.fileId,
          join(global.config.dataDir, 'resource', ctx.path),
        );
        ctx.status = 200;
        ctx.body = createReadStream(
          join(global.config.dataDir, 'resource', ctx.path),
        );
      }
    }
  }
};
