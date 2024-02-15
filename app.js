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

// Unsupported Method - POST, PUT, DELETE, PATCH, HEAD, OPTIONS
const UnsupportedMethods = (req,res,next) => {
  if (req.method !== 'GET' ||req.method === 'HEAD' || req.method === 'OPTIONS')
  {
    return res.status(405).end();
  }
  // app.use('/healthz', UnsupportedMethods);
  // next();
  //  // Supported Method - GET method

  //  if app.get('/healthz', async (req, res) => {
  //   if (Object.keys(req.query).length > 0 || Object.keys(req.body).length !== 0) {
  //     return res.status(400).end();
  //   }
  //   try {
  //     await sequelize.authenticate();
  //     res.set('Cache-Control', 'no-store');
  //     res.status(200).end(); 
  //   } catch (error) {
  //     res.status(503).end();
  //   }
  // });
};







// Handle 404 Not Found function
app.use((req, res) => {
  if (req.accepts('json')) {
  res.status(404).end();
  }
});

// // Start the server and sync the Sequelize models
// sequelize.sync().then(() => {
//   app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
//   });
// });
