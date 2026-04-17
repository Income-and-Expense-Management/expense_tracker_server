import express from 'express';
import syncController from '../controllers/syncController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { validateSyncPush } from '../middleware/validators/syncValidators.js';

const router = express.Router();

// All sync endpoints require authentication
router.use(authenticateToken);

// Pull — Client fetches all records changed since last_sync_time
// Query param: ?last_sync_time=<ISO8601|UnixMs|0>  (omit for full sync)
router.get('/pull', syncController.pull);

// Push — Client sends its locally changed records to the server
// Body: { wallets[], categories[], transactions[], budgets[] }
router.post('/push', validateSyncPush, syncController.push);

export default router;
