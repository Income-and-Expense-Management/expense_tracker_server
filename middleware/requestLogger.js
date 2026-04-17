import { logger } from '../utils/logger.js';

// Simple request/response logger for debugging
export default (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Avoid logging sensitive headers
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization) safeHeaders.authorization = 'REDACTED';

  try {
    const qs = Object.keys(req.query).length ? ` query=${JSON.stringify(req.query)}` : '';
    const bd = req.body && Object.keys(req.body).length ? ` body=${JSON.stringify(req.body)}` : '';
    logger.debug(`[Req] ${method} ${originalUrl}${qs}${bd} headers=${JSON.stringify(safeHeaders)}`);
  } catch (err) {
    logger.debug(`[Req] ${method} ${originalUrl} (failed to stringify request payload)`);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`[Res] ${method} ${originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });

  next();
};
