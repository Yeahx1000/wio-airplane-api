import express from 'express';
import { configureApp } from './config/app.js';
import { airportRoutes } from './http/routes/index.js';

const app = express();

configureApp(app);

app.use('/api/airports', airportRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
