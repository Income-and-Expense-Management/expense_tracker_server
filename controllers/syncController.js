import { syncService } from '../services/syncService.js';
import ApiResponse from '../utils/responseUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

const syncController = {
  /**
   * GET /api/v1/sync/pull?last_sync_time=<ISO8601 or Unix timestamp>
   *
   * Pull all records changed since `last_sync_time` for the authenticated user.
   * If `last_sync_time` is omitted or 0, performs a full sync (epoch start).
   */
  async pull(req, res) {
    try {
      const userId = req.user.userId;
      const { last_sync_time } = req.query;

      // Parse last_sync_time: accept ISO 8601 string or Unix timestamp (ms or s).
      // Defaults to epoch (0) for full sync when not provided.
      let sinceDate;
      if (!last_sync_time || last_sync_time === '0') {
        sinceDate = new Date(0); // Full sync: fetch everything from epoch
      } else {
        // Support both Unix timestamp (numeric string) and ISO 8601
        const parsed = isNaN(Number(last_sync_time))
          ? new Date(last_sync_time)          // ISO 8601 string
          : new Date(Number(last_sync_time)); // Unix ms timestamp

        if (isNaN(parsed.getTime())) {
          return ApiResponse.badRequest(res, ERROR_MESSAGES.SYNC_INVALID_LAST_SYNC_TIME);
        }
        sinceDate = parsed;
      }

      const result = await syncService.pull(userId, sinceDate);
      return ApiResponse.success(res, result, 'Đồng bộ dữ liệu thành công');
    } catch (error) {
      logger.error('SyncController.pull error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * POST /api/v1/sync/push
   *
   * Push a batch of changed records from the client to the server.
   * Body is pre-validated by `validateSyncPush` middleware before reaching here.
   * Returns applied IDs and a server_sync_time for the client to store.
   */
  async push(req, res) {
    try {
      const userId = req.user.userId;
      // req.body is already validated and coerced by validateSyncPush middleware
      const payload = req.body;

      const result = await syncService.push(userId, payload);
      return ApiResponse.success(res, result, 'Đẩy dữ liệu đồng bộ thành công');
    } catch (error) {
      logger.error('SyncController.push error:', error);
      return ApiResponse.error(res, error.message);
    }
  },
};

export default syncController;
