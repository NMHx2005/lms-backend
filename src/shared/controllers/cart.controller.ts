import { Request, Response } from 'express';
import Cart from '../models/payment/Cart';

export const getCart = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const cart = await Cart.findOne({ userId }) || (await Cart.create({ userId, items: [] }));
  return res.json({ success: true, data: cart });
};

export const addItem = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { title, price, quantity = 1, productId } = req.body || {};
  if (!title || price == null) return res.status(400).json({ success: false, message: 'title, price required' });
  const cart = (await Cart.findOne({ userId })) || (await Cart.create({ userId, items: [] }));
  const idx = cart.items.findIndex((i) => i.productId?.toString() === productId || i.title === title);
  if (idx >= 0) {
    cart.items[idx].quantity += Number(quantity || 1);
  } else {
    cart.items.push({ title, price, quantity: Number(quantity || 1), productId });
  }
  await cart.save();
  return res.json({ success: true, data: cart });
};

export const updateItem = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { index } = req.params as any;
  const { quantity } = req.body || {};
  const cart = await Cart.findOne({ userId });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
  const idx = Number(index);
  if (idx < 0 || idx >= cart.items.length) return res.status(400).json({ success: false, message: 'Invalid index' });
  cart.items[idx].quantity = Math.max(1, Number(quantity || 1));
  await cart.save();
  return res.json({ success: true, data: cart });
};

export const removeItem = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { index } = req.params as any;
  const cart = await Cart.findOne({ userId });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
  const idx = Number(index);
  if (idx < 0 || idx >= cart.items.length) return res.status(400).json({ success: false, message: 'Invalid index' });
  cart.items.splice(idx, 1);
  await cart.save();
  return res.json({ success: true, data: cart });
};

export const clearCart = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const cart = await Cart.findOne({ userId });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
  cart.items = [];
  await cart.save();
  return res.json({ success: true, data: cart });
};


