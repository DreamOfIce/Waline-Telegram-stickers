import { lookup } from 'mime-types';
import { createReadStream } from 'node:fs';
import { access, constants } from 'node:fs/promises';
import { join, relative } from 'node:path';

async function staticMiddleware(root, ctx) {
  if (ctx.method === 'GET' || ctx.method === 'HEAD') {
    const path = join(root, ctx.path.slice(1));
    if (relative(root, path).startsWith('../')) {
      ctx.status = 403;
      return;
    }
    try {
      await access(path, constants.R_OK);
    } catch {
      ctx.status = 404;
      return;
    }
    ctx.type = lookup(path);
    ctx.body = createReadStream(path);
  } else {
    ctx.status = 405;
  }
}
/**
 * Create a Koa middleware to host static files
 * @param {String} root root directory
 */
export default (root) => staticMiddleware.bind(null, root);
