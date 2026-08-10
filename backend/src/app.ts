import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

import path from 'path';
import fs from 'fs';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mini ERP + CRM Operations Portal Backend API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', routes);

// Serve Frontend Production Build (Single URL Deployment)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // 404 Fallback if frontend dist is not built
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
      error: 'NOT_FOUND',
    });
  });
}

// Central Error Handler
app.use(errorHandler);

export default app;
