import express from 'express';
import categoryController from '../controllers/categoryController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import {
  validateCreateCategory,
  validateUpdateCategory,
} from '../middleware/validators/categoryValidators.js';

const router = express.Router();

// All category routes require authentication
router.use(authenticateToken);

// Category CRUD
router.post('/',               validateCreateCategory,  categoryController.createCategory);
router.get('/',                                         categoryController.getAllCategories);
router.get('/:categoryId',                              categoryController.getCategoryById);
router.patch('/:categoryId',   validateUpdateCategory,  categoryController.updateCategory);
router.delete('/:categoryId',                           categoryController.deleteCategory);

export default router;
