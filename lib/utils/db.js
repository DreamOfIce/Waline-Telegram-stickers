import DataStorage from '@seald-io/nedb';
import { join } from 'node:path';

const key = Symbol.for('database');
if (!global[key]) {
  global[key] = new DataStorage({
    filename: join(global.config.dataDir, 'data.db'),
    autoload: true,
  });
  global[key].setAutocompactionInterval(600000); // 10 minute
}

export default global[key];
