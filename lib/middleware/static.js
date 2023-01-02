import { lookup } from 'mime-types';
import { createReadStream } from 'node:fs';
import { join, relative } from 'node:path';

async function staticMiddleware(root, ctx) {
  if (ctx.method === 'GET' || ctx.method === 'HEAD') {
    const path = join(root, ctx.path.slice(1));
    ctx.type = lookup(path);
    if (relative(root, path).startsWith('../')) {
      ctx.status = 403;
      return;
    }
    try {
      ctx.body = createReadStream(path);
    } catch (err) {
      ctx.status = 404;
    }
  } else {
    ctx.status = 405;
  }
}
/**
 * Create a Koa middleware to host static files
 * @param {String} root root directory
 */
export default (root) => staticMiddleware.bind(null, root);
