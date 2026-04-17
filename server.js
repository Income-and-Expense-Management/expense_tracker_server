import 'dotenv/config';
import app from './app.js';
import { logger } from './utils/logger.js';

// Start server
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server đang chạy tại: http://${HOST}:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});