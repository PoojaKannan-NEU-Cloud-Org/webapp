require('dotenv').config();
const express = require('express');
const sequelize = require('./src/config/sequelize');
const userRoutes = require('./src/routes/userRoutes');
const logger = require('./src/logger');

const app = express();
app.use(express.json());
const port = process.env.PORT || 8080;

// Sync Sequelize models to the database
sequelize.sync({ alter: true })
  .then(() => {
    // console.log('Database synchronized');
    logger.info('Database synchronized');

    // Start listening for requests after the database is synced
    app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    logger.error('Error synchronizing database:', error);
  });

// Use the userRoutes for the user endpoints
app.use('/v1/user', userRoutes);

const UnsupportedMethods = (req, res, next) => {
  if (req.method !== 'GET') { // Deny anything that's not a GET request
    logger.error("405 method not allowed");
    return res.status(405).end(); // 405 Method Not Allowed
    
  }
  next(); // Proceed if the request is a GET
};

// Middleware to deny unsupported methods on the /healthz endpoint
app.use('/healthz', UnsupportedMethods);

// Define the GET /healthz endpoint
app.get('/healthz', async (req, res) => {
  if (Object.keys(req.query).length > 0 || Object.keys(req.body).length !== 0) {
    logger.error("400 bad request") ;
    return res.status(400).end();
   // Bad Request if there are query parameters or body
  }
  try {
    await sequelize.authenticate(); // Example of a health check
    res.set('Cache-Control', 'no-store');
    res.status(200).end(); // Service is healthy
    logger.info("200 ok response successful");
  } catch (error) {
    logger.error(" 503 service unavailable");
    res.status(503).end(); 
  }
});
app.get('/newendpoint', (req, res) => {
  res.status(200).end();
  logger.info("200 ok response successful");
});

// Define the GET /newendpoint endpoint
app.get('/newendpoint', (req, res) => {
  res.status(200).end();
  logger.info("200 ok response successful");
});

// Handle 404 Not Found function
app.use((req, res) => {
  if (req.accepts('json')) {
    logger.error("404 not found");
  res.status(404).end();

  }
});


module.exports = app;


