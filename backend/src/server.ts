import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import cors from 'cors';
import marketRoutes from './routes/market.routes';
import { setupWebSocketServer } from './websocket/wsServer';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'crypto-monitor-backend', timestamp: Date.now() });
});

app.use('/api', marketRoutes);

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(app);
setupWebSocketServer(server);

server.listen(PORT, HOST, () => {
  logger.info(`HTTP server listening on http://${HOST}:${PORT}`);
});
