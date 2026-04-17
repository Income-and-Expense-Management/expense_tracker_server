import express from 'express';
import budgetController from '../controllers/budgetController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import {
  validateCreateBudget,
  validateUpdateBudget,
} from '../middleware/validators/budgetValidators.js';

const router = express.Router();

// All budget routes require authentication
router.use(authenticateToken);

// Budget CRUD
router.post('/',             validateCreateBudget,  budgetController.createBudget);
router.get('/',                                     budgetController.getAllBudgets);
router.get('/:budgetId',                            budgetController.getBudgetById);
router.patch('/:budgetId',   validateUpdateBudget,  budgetController.updateBudget);
router.delete('/:budgetId',                         budgetController.deleteBudget);

export default router;
