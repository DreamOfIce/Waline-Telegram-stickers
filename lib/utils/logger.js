import pino from 'pino';
import { join } from 'node:path';

const key = Symbol.for('logger');

if (!global[key]) {
  if (process.env.NODE_ENV !== 'production') {
    global[key] = pino({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
      },
    });
  } else {
    global[key] = pino({
      transport: {
        targets: [
          {
            level: 'error',
            target: 'pino/file',
            options: {
              destination: join(global.config.dataDir, 'logs', 'error.log'),
              mkdir: true,
            },
          },
          {
            level: 'info',
            target: 'pino/file',
            options: {
              destination: join(global.config.dataDir, 'logs', 'info.log'),
              mkdir: true,
            },
          },
        ],
      },
    });
  }
}
export default global[key];
