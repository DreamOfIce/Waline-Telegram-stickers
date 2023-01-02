import Koa from 'koa';
import koaCompress from 'koa-compress';
import { join } from 'node:path';
import expiresMiddleware from './lib/middleware/expires.js';
import logMiddleware from './lib/middleware/log.js';
import mainMiddleware from './lib/middleware/main.js';
import rewriteMiddleware from './lib/middleware/rewrite.js';
import staticMiddleware from './lib/middleware/static.js';
import logger from './lib/utils/logger.js';

export default () => {
  const app = new Koa();
  app.use(koaCompress());
  app.use(logMiddleware);
  app.use(rewriteMiddleware);
  app.use(expiresMiddleware);
  app.use(mainMiddleware);
  app.use(staticMiddleware(join(global.config.dataDir, 'resource')));

  // log error
  app.on('error', (err) => {
    if (err.status !== 404) logger.error(err);
  });

  app.listen({ host: global.config.host, port: global.config.port });
  logger.info(
    `Start listening on http://${global.config.host}:${global.config.port}`,
  );
};
