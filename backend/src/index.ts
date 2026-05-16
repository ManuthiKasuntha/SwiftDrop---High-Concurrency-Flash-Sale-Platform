import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import purchaseRoutes from './routes/purchase.routes';
import { streamUpdates } from './controllers/stream.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Nginx proxy
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// SSE Route
app.get('/api/stream', streamUpdates);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/purchase', purchaseRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
