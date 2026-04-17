import express from 'express';
import categoryController from '../controllers/categoryController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(authenticateToken);

// CRUD operations
router.post('/', categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.get('/:categoryId', categoryController.getCategoryById);
router.put('/:categoryId', categoryController.updateCategory);
router.delete('/:categoryId', categoryController.deleteCategory);

export default router;
