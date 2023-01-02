/**
 * Koa middleware to add Cache-Control header
 */
export default async (ctx, next) => {
  await next();
  if (ctx.status === 200) {
    if (ctx.response.is('image')) {
      ctx.set('Cache-Control', 'public, max-age=777600'); // 90d
    } else if (ctx.response.is('json')) {
      ctx.set('Cache-Control', 'public, max-age=604800'); // 7d
    }
  }
};
