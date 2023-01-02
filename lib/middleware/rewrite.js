const emojiImagePathRegExp = /^(?:(?:\/([\w-]+)){2}_(\w+)\.(webp|webm))$/i;

/**
 * Koa path rewriter
 */
export default async (ctx, next) => {
  if (emojiImagePathRegExp.test(ctx.path)) {
    const [setName, emojiName,emojiExt] = emojiImagePathRegExp.exec(ctx.path).slice(1);
    ctx.path = `/${setName}/${emojiName}.${emojiExt}`;
  }
  await next();
};
