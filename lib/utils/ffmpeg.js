/*
  Run this code on child-process
*/
import { createFFmpeg } from '@ffmpeg.wasm/main';
import { writeFile } from 'node:fs/promises';
import { exit } from 'node:process';

async function exec(obj) {
  const ffmpeg = createFFmpeg({ log: true });
  ffmpeg.setLogger(({ message }) => {
    if (message) process.send(message);
  });
  await ffmpeg.load();

  const { input, job, output } = obj;
  Object.entries(input).forEach(([vPath, value]) =>
    ffmpeg.FS('writeFile', vPath, value),
  );

  while (job.length > 0) {
    // eslint-disable-next-line no-await-in-loop
    await ffmpeg.run(...job.shift());
  }

  await Promise.all(
    Object.entries(output).map(async ([vPath, path]) => {
      process.send(`Save ${vPath} to ${path}`);
      await writeFile(path, ffmpeg.FS('readFile', vPath));
    }),
  );
  ffmpeg.exit();
  exit(0);
}

// only receive one message
process.once('message', (msg) => exec(msg));
