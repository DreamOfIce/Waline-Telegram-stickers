import dotenv from 'dotenv';
import loadConfig from './lib/utils/config.js';
import logger from './lib/utils/logger.js';

dotenv.config();

loadConfig();
logger.debug(`Configuration: %o`, global.config);

// start application
(await import('./app.js')).default();