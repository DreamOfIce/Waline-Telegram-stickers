import logger from "../utils/logger.js";

/**
 * Log Koa request with pino
 */
export default async ({ request, response }, next) => {
  await next();
  logger.info(
    `[http] ${request.method} ${request.url} ${response.status} ${response.message}`,
  );
}