import app from './app';
import { env } from './config/env';

const port = env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`[SERVER] OpsFlow ERP backend API running on port ${port} in ${env.NODE_ENV} mode.`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
