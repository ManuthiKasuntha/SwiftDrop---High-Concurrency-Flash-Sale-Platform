import { Request, Response } from 'express';
import prisma from '../utils/db';
import { broadcastStockUpdate } from './stream.controller';

// In-memory store for reservations since we removed Redis
const reservations = new Map<string, NodeJS.Timeout>();
const stockCache = new Map<string, number>();

export const reserveStock = async (req: any, res: Response) => {
  try {
    const { itemId } = req.body;
    const userId = req.user.id;

    const item = await prisma.item.findUnique({ where: { id: itemId }, include: { event: true } });
    if (!item) return res.status(404).json({ error: 'Not Found', message: 'Item not found' });

    if (item.event.status !== 'LIVE') {
      return res.status(400).json({ error: 'Bad Request', message: 'Event is not live' });
    }

    const userPurchaseKey = `user_purchases:${userId}:${itemId}`;

    if (reservations.has(userPurchaseKey)) {
      return res.status(400).json({ error: 'Bad Request', message: 'You have already purchased or reserved this item' });
    }

    // Check if user already purchased
    const existingOrder = await prisma.order.findUnique({
      where: {
        userId_itemId: { userId, itemId }
      }
    });

    if (existingOrder) {
      return res.status(400).json({ error: 'Bad Request', message: 'You have already purchased this item' });
    }

    // Use Prisma transaction to atomically check and decrement stock
    const updatedItem = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.item.findUnique({ where: { id: itemId } });
      if (!currentItem || currentItem.stock <= 0) {
        throw new Error('Sold Out');
      }

      return tx.item.update({
        where: { id: itemId },
        data: { stock: { decrement: 1 } }
      });
    });

    // Save stock to cache for fast reads
    stockCache.set(itemId, updatedItem.stock);

    // Create reservation timeout (e.g. 5 minutes)
    const timeout = setTimeout(async () => {
      reservations.delete(userPurchaseKey);
      // Increment stock back since they didn't confirm
      const revertedItem = await prisma.item.update({
        where: { id: itemId },
        data: { stock: { increment: 1 } }
      });
      stockCache.set(itemId, revertedItem.stock);
      broadcastStockUpdate(itemId, revertedItem.stock);
    }, 5 * 60 * 1000);

    reservations.set(userPurchaseKey, timeout);

    broadcastStockUpdate(itemId, updatedItem.stock);

    if (updatedItem.stock === 0) {
      await checkAndCloseEvent(item.eventId);
    }

    res.json({ message: 'Stock reserved. Proceed to payment', reservationId: userPurchaseKey, item: updatedItem });

  } catch (error: any) {
    if (error.message === 'Sold Out') {
      return res.status(400).json({ error: 'Bad Request', message: 'Sold Out' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to reserve stock' });
  }
};

export const confirmPurchase = async (req: any, res: Response) => {
  try {
    const { itemId } = req.body;
    const userId = req.user.id;

    const userPurchaseKey = `user_purchases:${userId}:${itemId}`;
    
    if (!reservations.has(userPurchaseKey)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Reservation expired or not found' });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Not Found', message: 'Item not found' });

    // Create Order in DB
    const order = await prisma.order.create({
      data: {
        userId,
        itemId,
        pricePaid: item.price,
        quantity: 1,
        status: 'CONFIRMED'
      }
    });

    // Clear the timeout so stock isn't reverted
    clearTimeout(reservations.get(userPurchaseKey)!);
    // Keep it in map without a timeout so they can't reserve again
    reservations.set(userPurchaseKey, setTimeout(()=>{},0));

    res.json({ message: 'Purchase confirmed', order });

  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bad Request', message: 'You have already purchased this item' });
    }
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to confirm purchase' });
  }
};

export const cancelReservation = async (req: any, res: Response) => {
  try {
    const { itemId } = req.body;
    const userId = req.user.id;
    
    const userPurchaseKey = `user_purchases:${userId}:${itemId}`;

    if (reservations.has(userPurchaseKey)) {
      clearTimeout(reservations.get(userPurchaseKey)!);
      reservations.delete(userPurchaseKey);

      // Increment stock
      const revertedItem = await prisma.item.update({
        where: { id: itemId },
        data: { stock: { increment: 1 } }
      });
      stockCache.set(itemId, revertedItem.stock);
      broadcastStockUpdate(itemId, revertedItem.stock);
    }

    res.json({ message: 'Reservation cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to cancel reservation' });
  }
}

async function checkAndCloseEvent(eventId: string) {
  const items = await prisma.item.findMany({ where: { eventId } });
  let allSoldOut = true;
  for (const item of items) {
    if (item.stock > 0) {
      allSoldOut = false;
      break;
    }
  }

  if (allSoldOut) {
    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'CLOSED' }
    });
  }
}
