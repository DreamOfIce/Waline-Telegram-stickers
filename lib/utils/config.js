import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const vaildEnv = [
  'HOST',
  'PORT',
  'WTS_API_ENDPOINT',
  'WTS_BOT_TOKEN',
  'WTS_DATA_DIR',
];
const defaultConfig = {
  host: '0.0.0.0',
  port: 8010,
  apiEndpoint: 'https://api.telegram.org',
  dataDir: join(dirname(fileURLToPath(import.meta.url)), '../..', 'data'),
};

export default function loadConfig() {
  global.config = { ...global.config, ...defaultConfig };
  Object.entries(process.env).forEach(([key, value]) => {
    if (vaildEnv.includes(key)) {
      const configKey = (key.startsWith('WTS_') ? key.slice(4) : key)
        .split('_')
        .map((word, i) =>
          i === 0
            ? word.toLowerCase()
            : `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`,
        )
        .join('');
      global.config[configKey] = value;
    }
  });
}
