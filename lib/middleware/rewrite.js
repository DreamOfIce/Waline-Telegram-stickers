const emojiImagePathRegExp = /^(?:(?:\/([\w-]+)){2}_(\w+)\.webp)$/i;

/**
 * Koa path rewriter
 */
export default async (ctx, next) => {
  if (emojiImagePathRegExp.test(ctx.path)) {
    const [setName, emojiName] = emojiImagePathRegExp.exec(ctx.path);
    ctx.path = `/${setName}/${emojiName}.webp`;
  }
  await next();
};
