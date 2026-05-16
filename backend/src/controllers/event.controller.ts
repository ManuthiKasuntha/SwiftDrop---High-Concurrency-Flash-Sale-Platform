import { Request, Response } from 'express';
import prisma from '../utils/db';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { name, coverPhoto, goLiveTime, items } = req.body;
    
    // items should be an array of { name, price, stock }
    const event = await prisma.event.create({
      data: {
        name,
        coverPhoto,
        goLiveTime: new Date(goLiveTime),
        items: {
          create: items
        }
      },
      include: { items: true }
    });

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create event' });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, coverPhoto, goLiveTime } = req.body;

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) return res.status(404).json({ error: 'Not Found', message: 'Event not found' });
    
    if (existingEvent.status !== 'LOCKED') {
      return res.status(400).json({ error: 'Bad Request', message: 'Cannot edit an event that is not LOCKED' });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        name,
        coverPhoto,
        goLiveTime: new Date(goLiveTime)
      }
    });

    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update event' });
  }
};

export const forceEventStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'LIVE' or 'CLOSED'

    const event = await prisma.event.update({
      where: { id },
      data: { status }
    });

    res.json({ message: `Event status updated to ${status}`, event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update event status' });
  }
};

export const getAdminEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        items: {
          include: {
            orders: {
              where: { status: 'CONFIRMED' }
            }
          }
        }
      },
      orderBy: { goLiveTime: 'desc' }
    });

    const enrichedEvents = events.map(event => {
      let totalRevenue = 0;
      let totalUnitsSold = 0;
      
      event.items.forEach(item => {
        const itemSold = item.orders.reduce((sum, order) => sum + order.quantity, 0);
        totalUnitsSold += itemSold;
        totalRevenue += itemSold * item.price;
      });

      return {
        ...event,
        totalRevenue,
        totalUnitsSold
      };
    });

    res.json({ events: enrichedEvents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch events' });
  }
};

export const getMarketplaceEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: { items: true },
      orderBy: { goLiveTime: 'asc' }
    });

    res.json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch events' });
  }
};

export const getEventDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!event) return res.status(404).json({ error: 'Not Found', message: 'Event not found' });

    res.json({ event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch event details' });
  }
};
