import { Router } from 'express';
import { authenticate } from '../../admin/middleware/auth';
import { getCart, addItem, updateItem, removeItem, clearCart } from '../controllers/cart.controller';

const router = Router();

router.use(authenticate);
router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:index', updateItem);
router.delete('/items/:index', removeItem);
router.delete('/', clearCart);

export default router;


