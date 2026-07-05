import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import logger from './config/logger.js';
import { connectDB, connectRedis } from './config/db.js';
import { HybridCryptoService } from './crypto/hybridCrypto.js';
import { DemoService } from './services/DemoService.js';
import { AuthController } from './controllers/AuthController.js';
import { ApiController } from './controllers/ApiController.js';
import { protect } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { setupSwagger } from './docs/swagger.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

setupSwagger(app);

// Auth
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/login', AuthController.login);
app.get('/api/auth/me', protect, AuthController.getMe);

// Core API
app.get('/api/server-key', ApiController.getServerPublicKey);
app.post('/api/demo/send', ApiController.demoSend);
app.get('/api/mesh/state', ApiController.meshState);
app.post('/api/mesh/gossip', ApiController.meshGossip);
app.post('/api/mesh/flush', ApiController.meshFlush);
app.post('/api/mesh/reset', ApiController.meshReset);
app.post('/api/bridge/ingest', ApiController.ingest);
app.get('/api/accounts', ApiController.listAccounts);
app.get('/api/transactions', ApiController.listTransactions);

app.use(errorHandler);

async function startServer() {
  logger.info('Starting UPI Offline Mesh Server...');

  await connectDB();
  await connectRedis();

  const crypto = HybridCryptoService.getInstance();
  await crypto.init();

  const demo = DemoService.getInstance();
  await demo.seedAccounts();

  app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`Interactive API Documentation is available at http://localhost:${env.PORT}/api-docs`);
  });
}

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  if (err.stack) logger.error(err.stack);
});

startServer();
