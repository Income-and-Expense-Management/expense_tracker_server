import express from 'express';
import budgetController from '../controllers/budgetController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(authenticateToken);

// CRUD operations
router.post('/', budgetController.createBudget);
router.get('/', budgetController.getAllBudgets);
router.get('/:budgetId', budgetController.getBudgetById);
router.put('/:budgetId', budgetController.updateBudget);
router.delete('/:budgetId', budgetController.deleteBudget);

export default router;
