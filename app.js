require('dotenv').config();
const express = require('express');
const sequelize = require('./src/config/sequelize');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
app.use(express.json());
const port = process.env.PORT || 8080;

// Sync Sequelize models to the database
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');

    // Start listening for requests after the database is synced
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error synchronizing database:', error);
  });

// Use the userRoutes for the user endpoints
app.use('/v1/user', userRoutes);

const UnsupportedMethods = (req, res, next) => {
  if (req.method !== 'GET') { // Deny anything that's not a GET request
    return res.status(405).end(); // 405 Method Not Allowed
  }
  next(); // Proceed if the request is a GET
};

// Middleware to deny unsupported methods on the /healthz endpoint
app.use('/healthz', UnsupportedMethods);

// Define the GET /healthz endpoint
app.get('/healthz', async (req, res) => {
  if (Object.keys(req.query).length > 0 || Object.keys(req.body).length !== 0) {
    return res.status(400).end(); // Bad Request if there are query parameters or body
  }
  try {
    await sequelize.authenticate(); // Example of a health check
    res.set('Cache-Control', 'no-store');
    res.status(200).end(); // Service is healthy
  } catch (error) {
    res.status(503).end(); // Service Unavailable
  }
});




// Handle 404 Not Found function
app.use((req, res) => {
  if (req.accepts('json')) {
  res.status(404).end();
  }
});

// // Start the server and sync the Sequelize models
// sequelize.sync().then(() => {
//   app.listen(port, () => {
//     console.log(Server running on http://localhost:${port});
//   });
// });

module.exports = app;
