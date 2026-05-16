import { Request, Response } from 'express';

// Store connected clients
let clients: { id: string, res: Response }[] = [];

export const streamUpdates = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE

  // Tell the client we've connected
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  const clientId = Date.now().toString();
  clients.push({ id: clientId, res });

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
};

export const broadcastStockUpdate = (itemId: string, newStock: number) => {
  const data = JSON.stringify({ type: 'STOCK_UPDATE', itemId, stock: newStock });
  clients.forEach(client => {
    client.res.write(`data: ${data}\n\n`);
  });
};
